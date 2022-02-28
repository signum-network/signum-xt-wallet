import { Address, LedgerClientFactory, Transaction } from '@signumjs/core';
import { v4 as uuid } from 'uuid';

import { TempleMessageType } from 'lib/messaging';

import { HttpAdapterFetch } from '../httpAdapterFetch';
import { withUnlocked } from '../store';
import { getCurrentNetworkHost, getDApp } from './dapp';
import { requestConfirm } from './requestConfirm';
import { ExtensionErrorType, ExtensionMessageType, ExtensionSignRequest, ExtensionSignResponse } from './typings';

function isSignumAddress(address: string): boolean {
  try {
    Address.create(address);
    return true;
  } catch (_) {
    return false;
  }
}

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export async function requestSign(origin: string, req: ExtensionSignRequest): Promise<ExtensionSignResponse> {
  if (![isSignumAddress(req?.sourcePkh), HEX_PATTERN.test(req?.payload)].every(Boolean)) {
    throw new Error(ExtensionErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(ExtensionErrorType.NotGranted);
  }

  const networkHost = await getCurrentNetworkHost();
  if (networkHost.networkName !== dApp.network) {
    throw new Error(ExtensionErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.accountId) {
    throw new Error(ExtensionErrorType.NotFound);
  }

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
        sourcePkh: req.sourcePkh,
        payload: req.payload,
        preview
      },
      onDecline: () => {
        reject(new Error(ExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            const signedTransaction = await withUnlocked(({ vault }) => vault.signumSign(dApp.accountId, req.payload));
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
            type: TempleMessageType.DAppSignConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
