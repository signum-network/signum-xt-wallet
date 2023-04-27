import { v4 as uuid } from 'uuid';

import {
  NostrExtensionGetPublicKeyRequest,
  NostrExtensionGetPublicKeyResponse,
  NostrExtensionMessageType
} from 'lib/intercom/nostr/typings';
import { XTMessageType } from 'lib/messaging';

import { getCurrentAccountInfo, getDApp, setDApp } from '../dapp';
import { requestConfirm } from '../requestConfirm';
import { ExtensionErrorType } from '../typings';

export async function getPublicKey(
  origin: string,
  req: NostrExtensionGetPublicKeyRequest
): Promise<NostrExtensionGetPublicKeyResponse> {
  const [dApp, account] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);

  if (dApp) {
    return {
      type: NostrExtensionMessageType.GetPublicKeyResponse,
      publicKey: account.publicKeyNostr
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    const host = new URL(origin).host;
    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        network: 'Nostr',
        appMeta: {
          name: host
        }
      },
      onDecline: () => {
        reject(new Error(ExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === XTMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: 'Nostr',
              appMeta: {
                name: host
              }
            });
            resolve({
              type: NostrExtensionMessageType.GetPublicKeyResponse,
              publicKey: account.publicKeyNostr
            });
          } else {
            decline();
          }

          return {
            type: XTMessageType.DAppPermConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
