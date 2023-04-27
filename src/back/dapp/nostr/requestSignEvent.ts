import { getEventHash, validateEvent } from 'nostr-tools';
import { v4 as uuid } from 'uuid';

import {
  NostrExtensionErrorType,
  NostrExtensionMessageType,
  NostrExtensionSignRequest,
  NostrExtensionSignResponse
} from 'lib/intercom/nostr/typings';
import { XTMessageType } from 'lib/messaging';

import { withUnlocked } from '../../store';
import { getCurrentAccountInfo, getDApp } from '../dapp';
import { requestConfirm } from '../requestConfirm';
import { isAutoConfirmationExpired } from './isAutoConfirmationExpired';
export async function requestSignEvent(
  origin: string,
  req: NostrExtensionSignRequest
): Promise<NostrExtensionSignResponse> {
  const [dApp, account, isConfirmationExpired] = await Promise.all([
    getDApp(origin),
    getCurrentAccountInfo(),
    isAutoConfirmationExpired()
  ]);

  if (!dApp) {
    throw new Error(NostrExtensionErrorType.NotGranted);
  }

  if (!account.publicKeyNostr) {
    throw new Error(NostrExtensionErrorType.NoNostrAccount);
  }

  const event = req.event;
  if (!event.pubkey) event.pubkey = account.publicKeyNostr;
  if (!event.id) event.id = getEventHash(event);
  if (!validateEvent(event)) {
    throw new Event('Invalid Nostr Event');
  }

  if (!isConfirmationExpired) {
    const signedEvent = await withUnlocked(({ vault }) => vault.signNostrEvent(account.publicKey, req.event));
    return {
      type: NostrExtensionMessageType.SignResponse,
      event: signedEvent
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    await requestConfirm({
      id,
      payload: {
        type: 'signNostr',
        origin,
        network: 'Nostr',
        appMeta: dApp.appMeta,
        event: req.event,
        sourcePkh: account.publicKey,
        nostrPubKey: account.publicKeyNostr
      },
      onDecline: () => {
        reject(new Error(NostrExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (!(confirmReq?.type === XTMessageType.DAppSignConfirmationRequest && confirmReq?.id === id)) {
          return;
        }
        if (!confirmReq.confirmed) {
          decline();
        }

        const signedEvent = await withUnlocked(({ vault }) => vault.signNostrEvent(account.publicKey, req.event));

        resolve({
          type: NostrExtensionMessageType.SignResponse,
          event: signedEvent
        });

        return {
          type: XTMessageType.DAppSignConfirmationResponse
        };
      }
    });
  });
}
