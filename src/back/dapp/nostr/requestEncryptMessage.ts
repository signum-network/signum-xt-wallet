import { getEventHash, validateEvent } from 'nostr-tools';
import { v4 as uuid } from 'uuid';
import browser from 'webextension-polyfill';

import {
  NostrExtensionEncryptMessageRequest,
  NostrExtensionEncryptMessageResponse,
  NostrExtensionErrorType,
  NostrExtensionMessageType,
  NostrExtensionSignRequest,
  NostrExtensionSignResponse
} from 'lib/intercom/nostr/typings';
import { XTMessageType } from 'lib/messaging';

import { withUnlocked } from '../../store';
import { getCurrentAccountInfo, getDApp } from '../dapp';
import { requestConfirm } from '../requestConfirm';

async function isAutoConfirmationExpired() {
  // see AutoConfirmationSelect.tsx
  const { nostr_confirmation_timeout } = await browser.storage.local.get('nostr_confirmation_timeout');

  if (!nostr_confirmation_timeout) {
    return true;
  }
  const { started = 0, timeout = 0 } = nostr_confirmation_timeout;
  const elapsed = Math.floor(Date.now() / 1000) - started;

  if (elapsed > timeout) {
    // reset it
    await browser.storage.local.set({ nostr_confirmation_timeout: { started: 0, timeout: 0 } });
  }

  return elapsed > timeout;
}

export async function requestEncryptMessage(
  origin: string,
  req: NostrExtensionEncryptMessageRequest
): Promise<NostrExtensionEncryptMessageResponse> {
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

  const { peer, plaintext } = req;

  console.log('requestEncryptMessage', req);

  // if (!isConfirmationExpired) {
  const cipherText = await withUnlocked(({ vault }) => vault.encryptNostrMessage(account.publicKey, peer, plaintext));
  return {
    type: NostrExtensionMessageType.EncryptMessageResponse,
    cipherText
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
