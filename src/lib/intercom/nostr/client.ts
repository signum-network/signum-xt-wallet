import { Event as NostrEvent } from 'nostr-tools';
import { v4 as uuid } from 'uuid';
import browser from 'webextension-polyfill';

import {
  NostrExtensionErrorType,
  NostrExtensionMessageType,
  NostrExtensionRequest,
  NostrExtensionResponse
} from 'lib/intercom/nostr/typings';
import { SignumPageMessage, SignumPageMessageType } from 'lib/intercom/types';

interface RelayType {
  url: string;
  policy: { write: boolean; read: boolean };
}

class NostrError extends Error {
  constructor(msg: string) {
    super(`[Nostr Error] ${msg}`);
  }
}

export function createError(payload: any) {
  switch (payload) {
    case NostrExtensionErrorType.NotGranted:
      return new NostrError('Permission not granted');
    case NostrExtensionErrorType.InvalidParams:
      return new NostrError(`Invalid Params`);
    case NostrExtensionErrorType.InvalidEvent:
      return new NostrError('Invalid Event');
    default:
      return new NostrError('Unknown Error');
  }
}

function request(payload: NostrExtensionRequest): Promise<NostrExtensionResponse> {
  return new Promise<NostrExtensionResponse>((resolve, reject) => {
    const reqId = uuid();
    const handleMessage = (evt: MessageEvent) => {
      const res = evt.data as SignumPageMessage;
      if (evt.source !== window || res?.reqId !== reqId) {
        return;
      } else if (res?.type === SignumPageMessageType.Response) {
        resolve(res.payload);
        window.removeEventListener('message', handleMessage);
      } else if (res?.type === SignumPageMessageType.ErrorResponse) {
        reject(createError(res.payload));
        window.removeEventListener('message', handleMessage);
      }
    };
    window.postMessage(
      {
        type: SignumPageMessageType.Request,
        payload,
        reqId
      },
      '*'
    );

    window.addEventListener('message', handleMessage);
  });
}
function assertResponse(condition: boolean): asserts condition {
  if (!condition) {
    throw new NostrError('Invalid response type received');
  }
}

function injectNostrProvider() {
  const script = document.createElement('script');
  script.setAttribute('async', 'false');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', browser.runtime.getURL('nostr-provider.js'));
  document.head.appendChild(script);
}

async function getPublicKeyRequest() {
  let response = await request({ type: NostrExtensionMessageType.GetPublicKeyRequest });
  assertResponse(response.type === NostrExtensionMessageType.GetPublicKeyResponse);
  if (response.publicKey) {
    return response.publicKey;
  }
  response = await request({
    type: NostrExtensionMessageType.PermissionRequest,
    appMeta: {
      name: window.location.host
    }
  });
  assertResponse(response.type === NostrExtensionMessageType.PermissionResponse);
  return response.publicKey;
}

/**
 * Establish connection to nostr-provider.js and forwards incoming messages to background script
 */
export function initializeNostrBridge() {
  const Extension = 'signum-xt-wallet';

  window.addEventListener('message', async message => {
    if (message.source !== window) return;
    if (!message.data) return;
    if (!message.data.type) return;
    if (message.data.ext !== Extension) return;

    let response;
    try {
      switch (message.data.type) {
        case 'getPublicKey':
          response = await getPublicKeyRequest();
          break;
        case 'signEvent':
        case 'getRelays':
        case 'nip04.encrypt':
        case 'nip04.decrypt':
        default:
      }
    } catch (error) {
      response = { error };
    }

    // return response
    window.postMessage({ id: message.data.id, ext: Extension, response }, message.origin);
  });

  injectNostrProvider();
  console.info('[XT Wallet] - 🦩 nostr communication bridge mounted.');
}

// export function initializeNostrClient() {
// if (!window.nostr) {
//   window.nostr = {
//     _publicKey: null,
//
//     async getPublicKey() {
//       if (this._publicKey) {
//         return this._publicKey;
//       }
//
//       let response = await request({ type: NostrExtensionMessageType.GetPublicKeyRequest });
//
//       assertResponse(response.type === NostrExtensionMessageType.GetPublicKeyResponse);
//       if (response.publicKey) {
//         this._publicKey = response.publicKey;
//         return this._publicKey;
//       }
//
//       response = await request({
//         type: NostrExtensionMessageType.PermissionRequest,
//         appMeta: {
//           name: window.location.host
//         }
//       });
//       assertResponse(response.type === NostrExtensionMessageType.PermissionResponse);
//       this._publicKey = response.publicKey;
//       return this._publicKey;
//     },
//
//     async signEvent(event: NostrEvent) {
//       throw new NostrError('signEvent not implemented yet');
//     },
//
//     async getRelays(): Promise<RelayType[]> {
//       throw new NostrError('getRelays not implemented yet');
//     },
//
//     nip04: {
//       async encrypt(peer: string, plaintext: string) {
//         throw new NostrError('nip04.encrypt not implemented yet');
//       },
//
//       async decrypt(peer: string, ciphertext: string) {
//         throw new NostrError('nip04.decrypto not implemented yet');
//       }
//     }
//     //
//     // Not supported yet!
//     // nip26: {
//     //   async delegate(delegateePubkey, conditionsJson) {
//     //     return window.nostr._call('nip26.delegate', {delegateePubkey, conditionsJson})
//     //   }
//     // },
//   };
// }
// if (window.nostr) {
//   console.info('[XT Wallet] Nostr Extension initialized.');
// }
// }

// window.addEventListener('message', message => {
//   if (
//     !message.data ||
//     message.data.response === null ||
//     message.data.response === undefined ||
//     message.data.ext !== 'xt-wallet' ||
//     !window.nostr._requests[message.data.id]
//   )
//     return;
//
//   if (message.data.response.error) {
//     let error = new Error('nos2x: ' + message.data.response.error.message);
//     error.stack = message.data.response.error.stack;
//     window.nostr._requests[message.data.id].reject(error);
//   } else {
//     window.nostr._requests[message.data.id].resolve(message.data.response);
//   }
//
//   delete window.nostr._requests[message.data.id];
// });

// hack to replace nostr:nprofile.../etc links with something else
// let replacing = null;
// document.addEventListener('mousedown', replaceNostrSchemeLink);
// async function replaceNostrSchemeLink(e) {
//   if (e.target.tagName !== 'A' || !e.target.href.startsWith('nostr:')) return;
//   if (replacing === false) return;
//
//   let response = await window.nostr._call('replaceURL', { url: e.target.href });
//   if (response === false) {
//     replacing = false;
//     return;
//   }
//
//   e.target.href = response;
// }
