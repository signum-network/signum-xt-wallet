export type ExtensionRequest = ExtensionGetCurrentPermissionRequest | ExtensionPermissionRequest | ExtensionSignRequest;

export type ExtensionResponse =
  | ExtensionGetCurrentPermissionResponse
  | ExtensionPermissionResponse
  | ExtensionSignResponse;

export interface ExtensionMessageBase {
  type: ExtensionMessageType;
}

export enum ExtensionMessageType {
  GetCurrentPermissionRequest = 'GET_CURRENT_PERMISSION_REQUEST',
  GetCurrentPermissionResponse = 'GET_CURRENT_PERMISSION_RESPONSE',
  PermissionRequest = 'PERMISSION_REQUEST',
  PermissionResponse = 'PERMISSION_RESPONSE',
  SignRequest = 'SIGN_REQUEST',
  SignResponse = 'SIGN_RESPONSE'
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
