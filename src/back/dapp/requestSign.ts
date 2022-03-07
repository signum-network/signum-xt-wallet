import { LedgerClientFactory, Transaction } from '@signumjs/core';
import { v4 as uuid } from 'uuid';

import { XTMessageType } from 'lib/messaging';

import { HttpAdapterFetch } from '../httpAdapterFetch';
import { withUnlocked } from '../store';
import { getCurrentAccountPublicKey, getCurrentNetworkHost, getDApp } from './dapp';
import { requestConfirm } from './requestConfirm';
import { ExtensionErrorType, ExtensionMessageType, ExtensionSignRequest, ExtensionSignResponse } from './typings';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export async function requestSign(origin: string, req: ExtensionSignRequest): Promise<ExtensionSignResponse> {
  if (!HEX_PATTERN.test(req?.payload)) {
    throw new Error(ExtensionErrorType.InvalidParams);
  }

  const [dApp, accountPublicKey] = await Promise.all([getDApp(origin), getCurrentAccountPublicKey()]);

  if (!dApp) {
    throw new Error(ExtensionErrorType.NotGranted);
  }

  const networkHost = await getCurrentNetworkHost();

  // Network check is done on UI - no send possible

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    const { rpcBaseURL } = networkHost;
    const httpClient = new HttpAdapterFetch(rpcBaseURL);
    const ledger = LedgerClientFactory.createClient({ nodeHost: rpcBaseURL, httpClient });
    let preview: any;
    try {
      const transaction = await ledger.service.query<Transaction>('parseTransaction', {
        transactionBytes: req?.payload
      });
      preview = JSON.stringify(transaction);
    } catch {
      preview = null;
    }

    await requestConfirm({
      id,
      payload: {
        type: 'sign',
        origin,
        network: dApp.network,
        appMeta: dApp.appMeta,
        sourcePkh: accountPublicKey,
        payload: req.payload,
        preview
      },
      onDecline: () => {
        reject(new Error(ExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === XTMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed && networkHost.networkName === dApp.network) {
            const signedTransaction = await withUnlocked(({ vault }) =>
              vault.signumSign(accountPublicKey, req.payload)
            );
            const { transaction, fullHash } = await ledger.transaction.broadcastTransaction(signedTransaction);
            resolve({
              type: ExtensionMessageType.SignResponse,
              fullHash,
              transactionId: transaction
            });
          } else {
            decline();
          }

          return {
            type: XTMessageType.DAppSignConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
