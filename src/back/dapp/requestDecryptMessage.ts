import type { EncryptedMessage } from '@signumjs/crypto';

import { withUnlocked } from '../store';
import { getCurrentAccountInfo, getDApp } from './dapp';
import {
  ExtensionErrorType,
  ExtensionMessageDecryptRequest,
  ExtensionMessageDecryptResponse,
  ExtensionMessageType
} from './typings';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export async function requestDecryptMessage(
  origin: string,
  req: ExtensionMessageDecryptRequest
): Promise<ExtensionMessageDecryptResponse> {
  const [dApp, accountInfo] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);

  if (!dApp) {
    throw new Error(ExtensionErrorType.NotGranted);
  }

  const { messageIsText, cipherMessageHex, nonceHex, senderPublicKey } = req;

  if (!HEX_PATTERN.test(cipherMessageHex) && !HEX_PATTERN.test(nonceHex)) {
    throw new Error(ExtensionErrorType.InvalidParams);
  }

  const encryptedMessage: EncryptedMessage = {
    nonce: nonceHex,
    data: cipherMessageHex,
    isText: messageIsText
  };

  const plainText = await withUnlocked(({ vault }) =>
    vault.signumDecrypt(accountInfo.publicKey, encryptedMessage, senderPublicKey)
  );

  return {
    type: ExtensionMessageType.MessageDecryptResponse,
    plainText,
    messageIsText
  };
}
