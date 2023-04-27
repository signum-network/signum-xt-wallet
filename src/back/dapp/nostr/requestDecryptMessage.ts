import {
  NostrExtensionDecryptMessageRequest,
  NostrExtensionDecryptMessageResponse,
  NostrExtensionErrorType,
  NostrExtensionMessageType
} from 'lib/intercom/nostr/typings';

import { withUnlocked } from '../../store';
import { getCurrentAccountInfo, getDApp } from '../dapp';

export async function requestDecryptMessage(
  origin: string,
  req: NostrExtensionDecryptMessageRequest
): Promise<NostrExtensionDecryptMessageResponse> {
  const [dApp, account] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);

  if (!dApp) {
    throw new Error(NostrExtensionErrorType.NotGranted);
  }

  if (!account.publicKeyNostr) {
    throw new Error(NostrExtensionErrorType.NoNostrAccount);
  }

  const { peer, ciphertext } = req;

  // no permission necessary
  const plainText = await withUnlocked(({ vault }) => vault.decryptNostrMessage(account.publicKey, peer, ciphertext));
  return {
    type: NostrExtensionMessageType.DecryptMessageResponse,
    plainText
  };
}
