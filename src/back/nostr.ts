import * as secp256k1 from '@noble/secp256k1';

export interface NostrKeys {
  publicKey: string;
  privateKey: string;
}

async function sha512(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return secp256k1.etc.bytesToHex(new Uint8Array(hashBuffer));
}

export async function generateNostrKeys(seed: string): Promise<NostrKeys> {
  const hashedSeed = await sha512(seed);
  const privateKeyBytes = secp256k1.etc.hashToPrivateKey(hashedSeed);
  const privateKey = secp256k1.etc.bytesToHex(privateKeyBytes);
  const publicKey = secp256k1.etc.bytesToHex(secp256k1.getPublicKey(privateKeyBytes));
  return {
    privateKey,
    publicKey
  };
}
