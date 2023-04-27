export enum MessageType {
  Req = 'INTERCOM_REQUEST', // Request responses
  Res = 'INTERCOM_RESPONSE', // Reponse message
  Err = 'INTERCOM_ERROR', // Error message
  Sub = 'INTERCOM_SUBSCRIPTION' // Subscription updates
}

export interface Message {
  type: MessageType;
  data: any;
}

export interface ReqResMessage extends Message {
  type: MessageType.Req | MessageType.Res | MessageType.Err;
  reqId: number;
}

export interface RequestMessage extends ReqResMessage {
  type: MessageType.Req;
}

export interface ResponseMessage extends ReqResMessage {
  type: MessageType.Res;
}

export interface ErrorMessage extends ReqResMessage {
  type: MessageType.Err;
}

export interface SubscriptionMessage extends Message {
  type: MessageType.Sub;
}

/**
 * These are incoming/external message types
 */
export interface SignumPageMessage {
  type: SignumPageMessageType;
  payload: any;
  reqId?: string | number;
}

export enum SignumPageMessageType {
  Request = 'SIGNUM_PAGE_REQUEST',
  Response = 'SIGNUM_PAGE_RESPONSE',
  ErrorResponse = 'SIGNUM_PAGE_ERROR_RESPONSE'
}
