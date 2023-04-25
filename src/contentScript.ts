import 'mv3-hot-reload/content';
import browser from 'webextension-polyfill';

import { debounce } from 'lib/debounce';
import { IntercomClient, SignumPageMessageType, SignumPageMessage } from 'lib/intercom';
import { serializeError } from 'lib/intercom/helpers';
import { initializeNostrBridge } from 'lib/intercom/nostr/client';
import { XTMessageType, TempleResponse } from 'lib/messaging';

async function testIntercomConnection() {
  try {
    await getIntercom().request({
      type: XTMessageType.PageRequest,
      payload: 'PING'
    });
  } catch (err: any) {
    unsubscribe();
    intercom?.destroy();
    intercom = null;
    throw err;
  }
}

function keepSWAlive() {
  setTimeout(async function () {
    try {
      await browser.runtime.sendMessage('wakeup');
      await testIntercomConnection();
    } catch (e) {}
    keepSWAlive();
  }, 10_000);
}

const manifest = browser.runtime.getManifest();
if (manifest.manifest_version === 3) {
  keepSWAlive();
}

/**
 * Coming from a Signum/Nostr compatible extension
 */
window.addEventListener(
  'message',
  evt => {
    if (evt.source !== window) return;
    if (evt.data?.type === SignumPageMessageType.Request) {
      walletRequest(evt);
    }
  },
  false
);

const selectionHandler = debounce((_evt: MouseEvent) => {
  const selectedText = document.getSelection()?.toString() || '';

  getIntercom().request({
    type: XTMessageType.PageTextSelectedRequest,
    origin: document.location.origin,
    selected: selectedText.trim()
  });
}, 250);

document.addEventListener('mouseup', selectionHandler);

function walletRequest(evt: MessageEvent) {
  const { payload, reqId } = evt.data as SignumPageMessage;
  getIntercom()
    .request({
      type: XTMessageType.PageRequest,
      origin: evt.origin,
      payload
    })
    .then((res: TempleResponse) => {
      if (res?.type === XTMessageType.PageResponse) {
        send(
          {
            type: SignumPageMessageType.Response,
            payload: res.payload,
            reqId
          },
          evt.origin
        );
      }
    })
    .catch(err => {
      send(
        {
          type: SignumPageMessageType.ErrorResponse,
          payload: serializeError(err),
          reqId
        },
        evt.origin
      );
    });
}

function send(msg: SignumPageMessage, targetOrigin: string) {
  if (!targetOrigin || targetOrigin === '*') return;
  window.postMessage(msg, targetOrigin);
}

const AcceptedMessageTypes = new Set([
  XTMessageType.DAppNetworkChanged,
  XTMessageType.DAppPermissionRemoved,
  XTMessageType.DAppAccountRemoved,
  XTMessageType.DAppAccountChanged
]);

/**
 * Broadcasted/outgoing messages...
 */
function handleWalletNotification(msg: any) {
  if (AcceptedMessageTypes.has(msg?.type)) {
    window.postMessage(msg, window.location.origin);
  }
}

let intercom: IntercomClient | null;
let unsubscribe: () => void;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
    unsubscribe = intercom.subscribe(handleWalletNotification);
  }
  return intercom;
}

initializeNostrBridge();
