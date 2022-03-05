import { IntercomClient } from 'lib/intercom/client';
import { serializeError } from 'lib/intercom/helpers';
import { XTMessageType, TempleResponse } from 'lib/messaging';

interface SignumPageMessage {
  type: SignumPageMessageType;
  payload: any;
  reqId?: string | number;
}

enum SignumPageMessageType {
  Request = 'SIGNUM_PAGE_REQUEST',
  Response = 'SIGNUM_PAGE_RESPONSE',
  ErrorResponse = 'SIGNUM_PAGE_ERROR_RESPONSE'
}

window.addEventListener(
  'message',
  evt => {
    if (evt.source !== window) return;
    if (evt.data?.type === SignumPageMessageType.Request) {
      console.debug('Valid Signum XT Message received:', evt);
      walletRequest(evt);
    }
  },
  false
);

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

function handleWalletNotification(msg: any) {
  if (AcceptedMessageTypes.has(msg?.type)) {
    window.postMessage(msg, window.location.origin);
  }
}

let intercom: IntercomClient;

function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
    intercom.subscribe(handleWalletNotification);
  }
  return intercom;
}
