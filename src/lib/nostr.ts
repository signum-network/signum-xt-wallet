import * as secp256k1 from '@noble/secp256k1';
import { nip19 } from 'nostr-tools';

import { shortenString } from 'lib/shortenString';
export interface NostrKeys {
  publicKey: string;
  privateKey: string;
}

async function sha512(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return secp256k1.utils.bytesToHex(new Uint8Array(hashBuffer));
}

export async function generateNostrKeys(seed: string): Promise<NostrKeys> {
  const hashedSeed = await sha512(seed);
  const privateKeyBytes = secp256k1.utils.hashToPrivateKey(hashedSeed);
  const privateKey = secp256k1.utils.bytesToHex(privateKeyBytes);
  const publicKey = secp256k1.utils.bytesToHex(secp256k1.schnorr.getPublicKey(privateKey));
  return {
    privateKey,
    publicKey
  };
}

export function getNostrKeysFromPrivateKey(nsecOrHex: string): NostrKeys {
  const privateKey = nsecOrHex.startsWith('nsec') ? (nip19.decode(nsecOrHex).data as string) : nsecOrHex;
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

export function shortenPublicKey(pubKey: string): string {
  return shortenString(pubKey, 16, ':');
}
