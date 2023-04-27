import {
  NostrExtensionDecryptMessageRequest,
  NostrExtensionDecryptMessageResponse,
  NostrExtensionErrorType,
  NostrExtensionMessageType
} from 'lib/intercom/nostr/typings';

import { withUnlocked } from '../../store';
import { getCurrentAccountInfo, getDApp } from '../dapp';
import { isAutoConfirmationExpired } from './isAutoConfirmationExpired';

export async function requestDecryptMessage(
  origin: string,
  req: NostrExtensionDecryptMessageRequest
): Promise<NostrExtensionDecryptMessageResponse> {
  const [dApp, account, isConfirmationExpired] = await Promise.all([
    getDApp(origin),
    getCurrentAccountInfo(),
    isAutoConfirmationExpired()
  ]);

  // TODO: check if permission is required again!
  if (!dApp) {
    throw new Error(NostrExtensionErrorType.NotGranted);
  }

  if (!account.publicKeyNostr) {
    throw new Error(NostrExtensionErrorType.NoNostrAccount);
  }

  const { peer, ciphertext } = req;

  console.log('requestDecryptMessage', req);

  // if (!isConfirmationExpired) {
  const plainText = await withUnlocked(({ vault }) => vault.decryptNostrMessage(account.publicKey, peer, ciphertext));
  return {
    type: NostrExtensionMessageType.DecryptMessageResponse,
    plainText
  };
  // }

  // return new Promise(async (resolve, reject) => {
  //   const id = uuid();
  //   await requestConfirm({
  //     id,
  //     payload: {
  //       type: 'signNostr',
  //       origin,
  //       network: 'Nostr',
  //       appMeta: dApp.appMeta,
  //       event: req.event,
  //       sourcePkh: account.publicKey,
  //       nostrPubKey: account.publicKeyNostr
  //     },
  //     onDecline: () => {
  //       reject(new Error(NostrExtensionErrorType.NotGranted));
  //     },
  //     handleIntercomRequest: async (confirmReq, decline) => {
  //       if (!(confirmReq?.type === XTMessageType.DAppSignConfirmationRequest && confirmReq?.id === id)) {
  //         return;
  //       }
  //       if (!confirmReq.confirmed) {
  //         decline();
  //       }
  //
  //       const signedEvent = await withUnlocked(({ vault }) => vault.signNostrEvent(account.publicKey, req.event));
  //
  //       resolve({
  //         type: NostrExtensionMessageType.SignResponse,
  //         event: signedEvent
  //       });
  //
  //       return {
  //         type: XTMessageType.DAppSignConfirmationResponse
  //       };
  //     }
  //   });
  // });
}
