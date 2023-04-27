import { Event as NostrEvent } from 'nostr-tools';

import { NostrRelays } from 'lib/messaging';

export interface NostrEncryptParams {
  peer: string;
  plaintext: string;
}

export interface NostrDecryptParams {
  peer: string;
  ciphertext: string;
}

export type NostrExtensionRequest =
  | NostrExtensionGetPublicKeyRequest
  | NostrExtensionGetRelaysRequest
  | NostrExtensionPermissionRequest
  | NostrExtensionSignRequest
  | NostrExtensionEncryptMessageRequest
  | NostrExtensionDecryptMessageRequest;

export type NostrExtensionResponse =
  | NostrExtensionGetPublicKeyResponse
  | NostrExtensionGetRelaysResponse
  | NostrExtensionPermissionResponse
  | NostrExtensionSignResponse
  | NostrExtensionEncryptMessageResponse
  | NostrExtensionDecryptMessageResponse;

export interface NostrExtensionMessageBase {
  type: NostrExtensionMessageType;
}

export enum NostrExtensionMessageType {
  GetPublicKeyRequest = 'NOSTR_GET_PUBLIC_KEY_REQUEST',
  GetPublicKeyResponse = 'NOSTR_GET_PUBLIC_KEY_RESPONSE',
  GetRelaysRequest = 'NOSTR_GET_RELAYS_REQUEST',
  GetRelaysResponse = 'NOSTR_GET_RELAYS_RESPONSE',
  PermissionRequest = 'PERMISSION_REQUEST', // uses same permission request as signum dapps
  PermissionResponse = 'PERMISSION_RESPONSE', // uses same permission request as signum dapps
  SignRequest = 'NOSTR_SIGN_REQUEST',
  SignResponse = 'NOSTR_SIGN_RESPONSE',
  EncryptMessageRequest = 'NOSTR_ENCRYPT_MSG_REQUEST',
  EncryptMessageResponse = 'NOSTR_ENCRYPT_MSG_RESPONSE',
  DecryptMessageRequest = 'NOSTR_DECRYPT_MSG_REQUEST',
  DecryptMessageResponse = 'NOSTR_DeCRYPT_MSG_RESPONSE'
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

export interface NostrExtensionGetRelaysRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.GetRelaysRequest;
}

export interface NostrExtensionGetRelaysResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.GetRelaysResponse;
  relays: NostrRelays;
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
  event: NostrEvent;
}

export interface NostrExtensionSignResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.SignResponse;
  event: NostrEvent;
}

export interface NostrExtensionEncryptMessageRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.EncryptMessageRequest;
  peer: string;
  plaintext: string;
}

export interface NostrExtensionEncryptMessageResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.EncryptMessageResponse;
  cipherText: string;
}

export interface NostrExtensionDecryptMessageRequest extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.DecryptMessageRequest;
  peer: string;
  ciphertext: string;
}

export interface NostrExtensionDecryptMessageResponse extends NostrExtensionMessageBase {
  type: NostrExtensionMessageType.DecryptMessageResponse;
  plainText: string;
}

export enum NostrExtensionErrorType {
  NotGranted = 'NOT_GRANTED',
  InvalidParams = 'INVALID_PARAMS',
  InvalidEvent = 'INVALID_EVENT',
  NoNostrAccount = 'NOT_A_NOSTR_ACCOUNT'
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
