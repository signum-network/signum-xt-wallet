import { PassPhraseGenerator } from '@signumjs/crypto';

export async function generateSignumMnemonic() {
  const seed = new Uint8Array(256);
  window.crypto.getRandomValues(seed);
  const generator = new PassPhraseGenerator();
  const words = await generator.generatePassPhrase(Array.from(seed));
  return words.join(' ');
}
