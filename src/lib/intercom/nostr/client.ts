import { Event as NostrEvent } from 'nostr-tools';
import { v4 as uuid } from 'uuid';
import browser from 'webextension-polyfill';

import {
  NostrDecryptParams,
  NostrEncryptParams,
  NostrExtensionErrorType,
  NostrExtensionMessageType,
  NostrExtensionRequest,
  NostrExtensionResponse
} from 'lib/intercom/nostr/typings';
import { SignumPageMessage, SignumPageMessageType } from 'lib/intercom/types';

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
  const response = await request({ type: NostrExtensionMessageType.GetPublicKeyRequest });
  assertResponse(response.type === NostrExtensionMessageType.GetPublicKeyResponse);
  return response.publicKey;
}

async function signEvent(event: NostrEvent) {
  const response = await request({
    type: NostrExtensionMessageType.SignRequest,
    event
  });
  assertResponse(response.type === NostrExtensionMessageType.SignResponse);
  return response.event;
}

async function getRelays() {
  const response = await request({
    type: NostrExtensionMessageType.GetRelaysRequest
  });
  assertResponse(response.type === NostrExtensionMessageType.GetRelaysResponse);
  return response.relays;
}

async function nip04Encrypt({ peer, plaintext }: NostrEncryptParams) {
  const response = await request({
    type: NostrExtensionMessageType.EncryptMessageRequest,
    peer,
    plaintext
  });
  assertResponse(response.type === NostrExtensionMessageType.EncryptMessageResponse);
  return response.cipherText;
}

async function nip04Decrypt({ peer, ciphertext }: NostrDecryptParams) {
  const response = await request({
    type: NostrExtensionMessageType.DecryptMessageRequest,
    peer,
    ciphertext
  });
  assertResponse(response.type === NostrExtensionMessageType.DecryptMessageResponse);
  return response.plainText;
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
          if (message.data.params.event) {
            response = await signEvent(message.data.params.event);
          }
          break;
        case 'getRelays':
          response = await getRelays();
          break;
        case 'nip04.encrypt':
          response = await nip04Encrypt(message.data.params);
          break;
        case 'nip04.decrypt':
          response = await nip04Decrypt(message.data.params);
          break;
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
