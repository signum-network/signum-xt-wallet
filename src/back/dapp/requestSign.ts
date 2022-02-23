import { Address, LedgerClientFactory, Transaction } from '@signumjs/core';
import { TempleDAppErrorType } from '@temple-wallet/dapp/dist/types';
import { v4 as uuid } from 'uuid';

import { TempleMessageType } from 'lib/messaging';

import { HttpAdapterFetch } from '../httpAdapterFetch';
import { withUnlocked } from '../store';
import { getDApp, getNetworkRPC } from './dapp';
import { requestConfirm } from './requestConfirm';
import { ExtensionMessageType, ExtensionSignRequest, ExtensionSignResponse } from './typings';

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
  console.log('requestSign');
  if (req?.payload?.startsWith('0x')) {
    req = { ...req, payload: req.payload.substring(2) };
  }

  if (![isSignumAddress(req?.sourcePkh), HEX_PATTERN.test(req?.payload)].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    const networkRpc = await getNetworkRPC(dApp.network);
    const httpClient = new HttpAdapterFetch(networkRpc);
    const ledger = LedgerClientFactory.createClient({ nodeHost: networkRpc, httpClient });
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
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        payload: req.payload,
        preview
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            const signedTransaction = await withUnlocked(({ vault }) => vault.signumSign(dApp.pkh, req.payload));
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
