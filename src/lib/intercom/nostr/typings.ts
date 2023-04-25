import { Event as NostrEvent } from 'nostr-tools';

export type NostrExtensionRequest =
  | NostrExtensionGetPublicKeyRequest
  | NostrExtensionPermissionRequest
  | NostrExtensionSignRequest
  | NostrExtensionSendEncryptedMessageRequest;

export type NostrExtensionResponse =
  | NostrExtensionGetPublicKeyResponse
  | NostrExtensionPermissionResponse
  | NostrExtensionSignResponse
  | NostrExtensionSendEncryptedMessageResponse;

export interface NostrExtensionMessageBase {
  type: NostrExtensionMessageType;
}

export enum NostrExtensionMessageType {
  GetPublicKeyRequest = 'NOSTR_GET_PUBLIC_KEY_REQUEST',
  GetPublicKeyResponse = 'NOSTR_GET_PUBLIC_KEY_RESPONSE',
  PermissionRequest = 'PERMISSION_REQUEST', // uses same permission request as signum dapps
  PermissionResponse = 'PERMISSION_RESPONSE', // uses same permission request as signum dapps
  SignRequest = 'NOSTR_SIGN_REQUEST',
  SignResponse = 'NOSTR_SIGN_RESPONSE',
  SendEncryptedMessageRequest = 'NOSTR_SEND_ENCRYPTED_MSG_REQUEST',
  SendEncryptedMessageResponse = 'NOSTR_SEND_ENCRYPTED_MSG_RESPONSE'
}

/**
 * Messages
 */

export interface NostrExtensionGetPublicKeyRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.GetPublicKeyRequest;
}

export interface NostrExtensionGetPublicKeyResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.GetPublicKeyResponse;
  publicKey: string;
}

export interface NostrExtensionPermissionRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.PermissionRequest;
  appMeta: NostrExtensionDAppMetadata;
}

export interface NostrExtensionPermissionResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.PermissionResponse;
  publicKey: string;
}

export interface NostrExtensionSignRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.SignRequest;
  payload: string;
}

export interface NostrExtensionSignResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.SignResponse;
  event: NostrEvent;
}

export interface NostrExtensionSendEncryptedMessageRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.SendEncryptedMessageRequest;
  plainMessage: string;
  messageIsText: boolean;
  recipientPublicKey: string;
  feeSigna?: string;
}

export interface NostrExtensionSendEncryptedMessageResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.SendEncryptedMessageResponse;
  transactionId: string;
  fullHash: string;
}

export enum NostrExtensionErrorType {
  NotGranted = 'NOT_GRANTED',
  InvalidParams = 'INVALID_PARAMS',
  InvalidEvent = 'INVALID_EVENT'
}

export type NostrExtensionPermission = {
  currentNodeHost: string;
  availableNodeHosts: string[];
  accountId: string;
  publicKey: string;
  watchOnly: boolean;
} | null;

export type NostrExtensionSigned = {
  transactionId: string;
  fullHash: string;
} | null;

export interface NostrExtensionDAppMetadata {
  name: string;
}
