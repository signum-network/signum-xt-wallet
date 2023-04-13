import * as secp256k1 from '@noble/secp256k1';
import { nip19 } from 'nostr-tools';

import { shortenString } from 'lib/shortenString';

export interface NostrKeys {
  publicKey: string;
  privateKey: string;
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
