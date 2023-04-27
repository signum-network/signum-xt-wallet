import * as secp256k1 from '@noble/secp256k1';
import { nip19, Event as NostrEvent, signEvent, validateEvent, getEventHash, nip04 } from 'nostr-tools';

export interface NostrKeys {
  publicKey: string;
  privateKey: string;
}

export enum Kind {
  Metadata = 0,
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Reposts = 6,
  Reaction = 7,
  BadgeAward = 8,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  FileMetadata = 1063,
  Reporting = 1984,
  ZapRequest = 9734,
  Zap = 9735,
  MuteList = 10000,
  PinList = 10000,
  RelayList = 10002,
  ClientAuth = 22242,
  NostrConnect = 24133,
  CategorizedPeopleList = 30000,
  CategorizedBookmarkList = 30001,
  BadgeDefinition = 30008,
  ProfileBadge = 30009,
  EditStall = 30017,
  EditProduct = 30018,
  Article = 30023,
  ApplicationData = 30078
}

/*
 * Used to derives a key (adding more entropy) from the initial seed
 * The steps are:
 * - sha256 from the initial seed as salt
 * - Apply PBKDF2 using the derivation parameters
 * - export key and convert to UInt8Array
 * - finally use as privatekey generation input
 */

const KeyDerivationParameters = {
  iterations: 500_000,
  hash: 'SHA-256',
  keyType: { name: 'HMAC', hash: 'SHA-512', length: 512 }
};

async function deriveKey(seed: string, params = KeyDerivationParameters) {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const salt = await crypto.subtle.digest('SHA-256', data);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(seed), 'PBKDF2', false, ['deriveKey']);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: params.iterations,
      hash: params.hash
    },
    keyMaterial,
    params.keyType,
    true,
    ['sign']
  );

  return crypto.subtle.exportKey('raw', derivedKey);
}

export async function generateNostrKeys(seed: string): Promise<NostrKeys> {
  const derivedKey = await deriveKey(seed);
  const privateKeyBytes = secp256k1.utils.hashToPrivateKey(new Uint8Array(derivedKey));
  const privateKey = secp256k1.utils.bytesToHex(privateKeyBytes);
  const publicKey = secp256k1.utils.bytesToHex(secp256k1.schnorr.getPublicKey(privateKey));
  return {
    privateKey,
    publicKey
  };
}

function ensureHexPrivateKey(nsecOrHex: string): string {
  return nsecOrHex.startsWith('nsec') ? (nip19.decode(nsecOrHex).data as string) : nsecOrHex;
}
export function getNostrKeysFromPrivateKey(nsecOrHex: string): NostrKeys {
  const privateKey = ensureHexPrivateKey(nsecOrHex);
  const publicKey = secp256k1.utils.bytesToHex(secp256k1.schnorr.getPublicKey(privateKey));
  return {
    publicKey,
    privateKey
  };
}

export function isAcceptableNostrPrivKey(nsecOrHex: string): boolean {
  return /^nsec1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58}|[0-9a-fA-F]{64}$/.test(nsecOrHex);
}

export async function encodePubKey(pubKey: string) {
  return nip19.npubEncode(pubKey);
}

export function getNostrEventName(kind: number): string {
  return Kind[kind] || 'Unknown';
}

export async function encryptNostrMessage(privKey: string, peerPubKey: string, plaintext: string): Promise<string> {
  const privateKey = ensureHexPrivateKey(privKey);
  return nip04.encrypt(privateKey, peerPubKey, plaintext);
}

export async function decryptNostrMessage(privKey: string, peerPubKey: string, ciphertext: string): Promise<string> {
  const privateKey = ensureHexPrivateKey(privKey);
  return nip04.decrypt(privateKey, peerPubKey, ciphertext);
}
export function signNostrEvent(privKey: string, event: NostrEvent): NostrEvent {
  const { publicKey, privateKey } = getNostrKeysFromPrivateKey(privKey);

  if (!event.pubkey) event.pubkey = publicKey;
  if (!event.id) event.id = getEventHash(event);
  if (!validateEvent(event)) {
    throw new Event('Invalid Nostr Event');
  }
  event.sig = signEvent(event, privateKey);

  return event;
}
