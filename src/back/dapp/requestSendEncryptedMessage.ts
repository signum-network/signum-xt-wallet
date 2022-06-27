import { Address, LedgerClientFactory, TransactionId } from '@signumjs/core';
import { Amount } from '@signumjs/util';
import { v4 as uuid } from 'uuid';

import { XTMessageType } from 'lib/messaging';

import { HttpAdapterFetch } from '../httpAdapterFetch';
import { withUnlocked } from '../store';
import { getCurrentAccountPublicKey, getCurrentNetworkHost, getDApp } from './dapp';
import { requestConfirm } from './requestConfirm';
import {
  ExtensionSendEncryptedMessageRequest,
  ExtensionSendEncryptedMessageResponse,
  ExtensionErrorType,
  ExtensionMessageType
} from './typings';

function estimateFee(msg: string): Amount {
  const Overhead = 232;
  const factor = Math.min(Math.floor((Overhead + msg.length) / 176), 6);
  return Amount.fromSigna(0.01).multiply(factor);
}

export async function requestSendEncryptedMessage(
  origin: string,
  req: ExtensionSendEncryptedMessageRequest
): Promise<ExtensionSendEncryptedMessageResponse> {
  const [dApp, accountPublicKey] = await Promise.all([getDApp(origin), getCurrentAccountPublicKey()]);

  if (!dApp) {
    throw new Error(ExtensionErrorType.NotGranted);
  }
  const networkHost = await getCurrentNetworkHost();

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    const { rpcBaseURL } = networkHost;
    const httpClient = new HttpAdapterFetch(rpcBaseURL);
    const ledger = LedgerClientFactory.createClient({ nodeHost: rpcBaseURL, httpClient });
    const sendFee = estimateFee(req.plainMessage);
    await requestConfirm({
      id,
      payload: {
        type: 'sendEncryptedMsg',
        origin,
        network: dApp.network,
        appMeta: dApp.appMeta,
        sourcePkh: accountPublicKey,
        targetPkh: req.recipientPublicKey,
        messageIsText: req.messageIsText,
        plainMessage: req.plainMessage,
        feeSigna: sendFee.getSigna()
      },
      onDecline: () => {
        reject(new Error(ExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === XTMessageType.DAppSendEncryptedMessageConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed && networkHost.networkName === dApp.network) {
            const { messageIsText, plainMessage, recipientPublicKey } = req;
            const { p2pEncryptionKey, signingKey } = await withUnlocked(({ vault }) =>
              vault.getSignumTxKeys(accountPublicKey)
            );
            const recipient = Address.fromPublicKey(recipientPublicKey);
            const { transaction, fullHash } = (await ledger.message.sendEncryptedMessage({
              messageIsText,
              recipientId: recipient.getNumericId(),
              recipientPublicKey: recipient.getPublicKey(),
              message: plainMessage,
              senderPublicKey: accountPublicKey,
              feePlanck: sendFee.getPlanck(),
              senderAgreementKey: p2pEncryptionKey,
              senderPrivateKey: signingKey
            })) as TransactionId;
            resolve({
              type: ExtensionMessageType.SendEncryptedMessageResponse,
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
