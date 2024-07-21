export type ExtensionRequest =
  | ExtensionGetCurrentPermissionRequest
  | ExtensionPermissionRequest
  | ExtensionSignRequest
  | ExtensionSendEncryptedMessageRequest
  | ExtensionMessageEncryptRequest
  | ExtensionMessageDecryptRequest;

export type ExtensionResponse =
  | ExtensionGetCurrentPermissionResponse
  | ExtensionPermissionResponse
  | ExtensionSignResponse
  | ExtensionSendEncryptedMessageResponse
  | ExtensionMessageEncryptResponse
  | ExtensionMessageDecryptResponse;

export interface ExtensionMessageBase {
  type: ExtensionMessageType;
}

export enum ExtensionMessageType {
  GetCurrentPermissionRequest = 'GET_CURRENT_PERMISSION_REQUEST',
  GetCurrentPermissionResponse = 'GET_CURRENT_PERMISSION_RESPONSE',
  MessageEncryptRequest = 'MESSAGE_ENCRYPT_REQUEST',
  MessageEncryptResponse = 'MESSAGE_ENCRYPT_RESPONSE',
  MessageDecryptRequest = 'MESSAGE_DECRYPT_REQUEST',
  MessageDecryptResponse = 'MESSAGE_DECRYPT_RESPONSE',
  PermissionRequest = 'PERMISSION_REQUEST',
  PermissionResponse = 'PERMISSION_RESPONSE',
  SignRequest = 'SIGN_REQUEST',
  SignResponse = 'SIGN_RESPONSE',
  SendEncryptedMessageRequest = 'SEND_ENCRYPTED_MSG_REQUEST',
  SendEncryptedMessageResponse = 'SEND_ENCRYPTED_MSG_RESPONSE'
}

/**
 * Messages
 */

export interface ExtensionGetCurrentPermissionRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.GetCurrentPermissionRequest;
}

export interface ExtensionGetCurrentPermissionResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.GetCurrentPermissionResponse;
  permission: ExtensionPermission;
}

export interface ExtensionPermissionRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.PermissionRequest;
  network: string;
  appMeta: ExtensionDAppMetadata;
}

export interface ExtensionPermissionResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.PermissionResponse;
  accountId: string;
  publicKey: string;
  watchOnly: boolean;
  availableNodeHosts: string[];
  currentNodeHost: string;
}

export interface ExtensionSignRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.SignRequest;
  payload: string;
}

export interface ExtensionSignResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.SignResponse;
  transactionId: string;
  fullHash: string;
}

export interface ExtensionSendEncryptedMessageRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.SendEncryptedMessageRequest;
  plainMessage: string;
  messageIsText: boolean;
  recipientPublicKey: string;
  feeSigna?: string;
}

export interface ExtensionSendEncryptedMessageResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.SendEncryptedMessageResponse;
  transactionId: string;
  fullHash: string;
}

export interface ExtensionMessageEncryptRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.MessageEncryptRequest;
  plainMessage: string;
  messageIsText: boolean;
  recipientPublicKey: string;
}

export interface ExtensionMessageEncryptResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.MessageEncryptResponse;
  cipherMessageHex: string;
  nonceHex: string;
  messageIsText: boolean;
}

export interface ExtensionMessageDecryptRequest extends ExtensionMessageBase {
  type: ExtensionMessageType.MessageDecryptRequest;
  cipherMessageHex: string;
  nonceHex: string;
  messageIsText: boolean;
  senderPublicKey: string;
}

export interface ExtensionMessageDecryptResponse extends ExtensionMessageBase {
  type: ExtensionMessageType.MessageDecryptResponse;
  plainText: string;
  messageIsText: boolean;
}

export enum ExtensionErrorType {
  NotGranted = 'NOT_GRANTED',
  NotFound = 'NOT_FOUND',
  InvalidParams = 'INVALID_PARAMS',
  InvalidNetwork = 'INVALID_NETWORK'
}

export type ExtensionPermission = {
  currentNodeHost: string;
  availableNodeHosts: string[];
  accountId: string;
  publicKey: string;
  watchOnly: boolean;
} | null;

export type ExtensionSigned = {
  transactionId: string;
  fullHash: string;
} | null;

export interface ExtensionDAppMetadata {
  name: string;
}

export interface PageMessage {
  type: PageMessageType;
  payload: any;
  reqId?: string | number;
}

export enum PageMessageType {
  Request = 'SIGNUM_PAGE_REQUEST',
  Response = 'SIGNUM_PAGE_RESPONSE',
  ErrorResponse = 'SIGNUM_PAGE_ERROR_RESPONSE'
}
