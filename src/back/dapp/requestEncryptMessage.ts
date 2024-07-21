import type { EncryptedData, EncryptedMessage } from '@signumjs/crypto';

import { withUnlocked } from '../store';
import { getCurrentAccountInfo, getDApp } from './dapp';
import {
  ExtensionErrorType,
  ExtensionMessageEncryptRequest,
  ExtensionMessageEncryptResponse,
  ExtensionMessageType
} from './typings';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export async function requestEncryptMessage(
  origin: string,
  req: ExtensionMessageEncryptRequest
): Promise<ExtensionMessageEncryptResponse> {
  const [dApp, accountInfo] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);

  if (!dApp) {
    throw new Error(ExtensionErrorType.NotGranted);
  }

  const { messageIsText, plainMessage, recipientPublicKey } = req;

  if (!messageIsText && !HEX_PATTERN.test(plainMessage)) {
    throw new Error(ExtensionErrorType.InvalidParams);
  }

  const cipher = await withUnlocked(({ vault }) =>
    vault.signumEncrypt(accountInfo.publicKey, plainMessage, recipientPublicKey, messageIsText)
  );

  const cipherMessageHex = messageIsText
    ? (cipher as EncryptedMessage).data
    : Buffer.from((cipher as EncryptedData).data).toString('hex');
  const nonceHex = messageIsText
    ? (cipher as EncryptedMessage).nonce
    : Buffer.from((cipher as EncryptedData).nonce).toString('hex');
  return {
    type: ExtensionMessageType.MessageEncryptResponse,
    cipherMessageHex,
    nonceHex,
    messageIsText
  };
}
