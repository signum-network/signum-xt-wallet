import { IntercomClient } from 'lib/intercom/client';
import { serializeError } from 'lib/intercom/helpers';
import { TempleMessageType, TempleResponse } from 'lib/temple/types';

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
      type: TempleMessageType.PageRequest,
      origin: evt.origin,
      payload
    })
    .then((res: TempleResponse) => {
      if (res?.type === TempleMessageType.PageResponse) {
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

let intercom: IntercomClient;

function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
