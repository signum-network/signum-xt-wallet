import {
  NostrExtensionEncryptMessageRequest,
  NostrExtensionEncryptMessageResponse,
  NostrExtensionErrorType,
  NostrExtensionMessageType
} from 'lib/intercom/nostr/typings';

import { withUnlocked } from '../../store';
import { getCurrentAccountInfo, getDApp } from '../dapp';

export async function requestEncryptMessage(
  origin: string,
  req: NostrExtensionEncryptMessageRequest
): Promise<NostrExtensionEncryptMessageResponse> {
  const [dApp, account] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);

  if (!dApp) {
    throw new Error(NostrExtensionErrorType.NotGranted);
  }

  if (!account.publicKeyNostr) {
    throw new Error(NostrExtensionErrorType.NoNostrAccount);
  }

  const { peer, plaintext } = req;

  const cipherText = await withUnlocked(({ vault }) => vault.encryptNostrMessage(account.publicKey, peer, plaintext));
  return {
    type: NostrExtensionMessageType.EncryptMessageResponse,
    cipherText
  };
}
