import { Address } from '@signumjs/core';
import {
  decryptData,
  decryptMessage,
  encryptData,
  EncryptedMessage,
  encryptMessage,
  generateMasterKeys,
  generateSignature,
  generateSignedTransactionBytes,
  Keys,
  verifySignature
} from '@signumjs/crypto';
import { convertByteArrayToHexString } from '@signumjs/util';
import { Buffer } from 'buffer';
import browser from 'webextension-polyfill';

import { generateSignumMnemonic } from 'lib/generateSignumMnemonic';
import { XTAccount, XTAccountType, XTSettings } from 'lib/messaging';
import {
  decryptNostrMessage,
  encryptNostrMessage,
  generateNostrKeys,
  getNostrKeysFromPrivateKey,
  NostrKeys,
  signNostrEvent
} from 'lib/nostr';
import { clearStorage } from 'lib/temple/reset';

import { PublicError } from './defaults';
import * as Passworder from './passworder';
import { encryptAndSaveMany, fetchAndDecryptOne, isStored, removeMany } from './safe-storage';

const STORAGE_KEY_PREFIX = 'vault';
const DEFAULT_SETTINGS: XTSettings = {};

enum StorageEntity {
  Check = 'check',
  AccPrivKey = 'accprivkey',
  AccPrivP2PKey = 'accprivp2pkey',
  AccPubKey = 'accpubkey',
  NostrPubKey = 'nostrpubkey',
  NostrPrivKey = 'nostrprivkey',
  Accounts = 'accounts',
  Settings = 'settings'
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const accPrivP2PStrgKey = createDynamicStorageKey(StorageEntity.AccPrivP2PKey);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const nostrPubKeyStrgKey = createDynamicStorageKey(StorageEntity.NostrPubKey);
const nostrPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.NostrPrivKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);

export class Vault {
  static async isExist() {
    return isStored(checkStrgKey);
  }

  static async setup(password: string) {
    return withError('Failed to unlock wallet', async () => {
      const passKey = await Vault.toValidPassKey(password);
      return new Vault(passKey);
    });
  }

  static async registerNewWallet(password: string, mnemonic?: string) {
    return withError('Failed to create wallet', async () => {
      if (!mnemonic) {
        mnemonic = await generateSignumMnemonic();
      }
      const keys = generateMasterKeys(mnemonic);
      const accountId = Address.fromPublicKey(keys.publicKey).getNumericId();
      const initialAccount: XTAccount = {
        type: XTAccountType.Eigen,
        name: 'Account 1',
        publicKey: keys.publicKey,
        accountId
      };
      const newAccounts = [initialAccount];
      const passKey = await Passworder.generateKey(password);
      await clearStorage();
      await browser.storage.local.set({
        account_publickey: keys.publicKey,
        account_type: initialAccount.type
      });
      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [accPrivP2PStrgKey(accountId), keys.agreementPrivateKey],
          [accPrivKeyStrgKey(accountId), keys.signPrivateKey],
          [accPubKeyStrgKey(accountId), keys.publicKey],
          [accountsStrgKey, newAccounts]
        ],
        passKey
      );
    });
  }

  static async removeAccount(accPublicKey: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to remove account', async doThrow => {
      const allAccounts = await fetchAndDecryptOne<XTAccount[]>(accountsStrgKey, passKey);
      if (allAccounts.length === 1) {
        doThrow();
      }
      const acc = allAccounts.find(a => a.publicKey === accPublicKey);
      if (!acc || acc.type === XTAccountType.HD) {
        doThrow();
      }
      const newAllAcounts = allAccounts.filter(acc => acc.publicKey !== accPublicKey);
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], passKey);
      const accountId = Address.fromPublicKey(accPublicKey).getNumericId();
      await removeMany([accPrivKeyStrgKey(accountId), accPubKeyStrgKey(accountId)]);

      return newAllAcounts;
    });
  }

  static async revealNostrPrivateKey(accPublicKey: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal Nostr private key', () => {
      const accountId = Address.fromPublicKey(accPublicKey).getNumericId();
      return fetchAndDecryptOne<string>(nostrPrivKeyStrgKey(accountId), passKey);
    });
  }

  private static toValidPassKey(password: string) {
    return withError('Invalid password', async doThrow => {
      const passKey = await Passworder.generateKey(password);
      try {
        await fetchAndDecryptOne<any>(checkStrgKey, passKey);
      } catch (err: any) {
        console.log(err);
        doThrow();
      }
      return passKey;
    });
  }

  constructor(private passKey: CryptoKey) {}

  revealPublicKey(accPublicKey: string) {
    return withError('Failed to reveal public key', () => {
      const accountId = Address.fromPublicKey(accPublicKey).getNumericId();
      return fetchAndDecryptOne<string>(accPubKeyStrgKey(accountId), this.passKey);
    });
  }

  fetchAccounts() {
    return fetchAndDecryptOne<XTAccount[]>(accountsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<XTSettings>(settingsStrgKey, this.passKey);
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async createSignumAccount(name?: string): Promise<[string, XTAccount[]]> {
    return withError('Failed to create account', async () => {
      const allAccounts = await this.fetchAccounts();
      const mnemonic = await generateSignumMnemonic();
      const keys = generateMasterKeys(mnemonic);
      const accountId = Address.fromPublicKey(keys.publicKey).getNumericId();
      const accName = name || getNewAccountName(allAccounts);
      const newAccount: XTAccount = {
        type: XTAccountType.Eigen,
        name: accName,
        publicKey: keys.publicKey,
        accountId
      };
      const newAllAccounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivP2PStrgKey(accountId), keys.agreementPrivateKey],
          [accPrivKeyStrgKey(accountId), keys.signPrivateKey],
          [accPubKeyStrgKey(accountId), keys.publicKey],
          [accountsStrgKey, newAllAccounts]
        ],
        this.passKey
      );

      return [mnemonic, newAllAccounts];
    });
  }

  async importAccount(keys: Keys, name?: string, nostrKeys?: NostrKeys): Promise<XTAccount[]> {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();
      const accountId = Address.fromPublicKey(keys.publicKey).getNumericId();
      const newAccount: XTAccount = {
        type: XTAccountType.Eigen,
        name: name || getNewAccountName(allAccounts),
        publicKey: keys.publicKey,
        publicKeyNostr: nostrKeys ? nostrKeys.publicKey : undefined,
        accountId
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      const toEncrypt: [string, any][] = [
        [accPrivP2PStrgKey(accountId), keys.agreementPrivateKey],
        [accPrivKeyStrgKey(accountId), keys.signPrivateKey],
        [accPubKeyStrgKey(accountId), keys.publicKey],
        [accountsStrgKey, newAllAcounts]
      ];
      if (nostrKeys) {
        toEncrypt.push(
          [nostrPubKeyStrgKey(accountId), nostrKeys.publicKey],
          [nostrPrivKeyStrgKey(accountId), nostrKeys.privateKey]
        );
      }
      await encryptAndSaveMany(toEncrypt, this.passKey);

      return newAllAcounts;
    });
  }

  async importMnemonicAccount(passphrase: string, name?: string, withNostr?: boolean) {
    return withError('Failed to import account', async () => {
      try {
        const keys = generateMasterKeys(passphrase);
        const nostrKeys = withNostr ? await generateNostrKeys(passphrase) : undefined;
        return this.importAccount(keys, name, nostrKeys);
      } catch (_err) {
        throw new PublicError('Invalid Mnemonic or Password');
      }
    });
  }

  async importAccountFromNostrPrivKey(nsecOrHex: string, name?: string) {
    return withError('Failed to import account', async () => {
      try {
        const nostrKeys = getNostrKeysFromPrivateKey(nsecOrHex);
        const keys = generateMasterKeys(nostrKeys.privateKey);
        return this.importAccount(keys, name, nostrKeys);
      } catch (_err) {
        throw new PublicError('Invalid Nostr PrivateKey');
      }
    });
  }

  async importWatchOnlyAccount(accPublicKey: string, chainId?: string) {
    return withError('Failed to import Watch Only account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: XTAccount = {
        type: XTAccountType.WatchOnly,
        name: getNewAccountName(
          allAccounts.filter(({ type }) => type === XTAccountType.WatchOnly),
          'defaultWatchOnlyAccountName'
        ),
        publicKey: accPublicKey,
        chainId,
        accountId: Address.fromPublicKey(accPublicKey).getNumericId()
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPubKeyStrgKey(newAccount.accountId), newAccount.publicKey],
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async editAccountName(accPublicKey: string, name: string) {
    return withError('Failed to edit account name', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKey === accPublicKey)) {
        throw new PublicError('Account not found');
      }

      if (allAccounts.some(acc => acc.publicKey !== accPublicKey && acc.name === name)) {
        throw new PublicError('Account with same name already exist');
      }

      const newAllAcounts = allAccounts.map(acc => (acc.publicKey === accPublicKey ? { ...acc, name } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async setAccountIsActivated(accPublicKey: string) {
    return withError('Failed to update account', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKey === accPublicKey)) {
        throw new PublicError('Account not found');
      }
      const newAllAccounts = allAccounts.map(acc =>
        acc.publicKey === accPublicKey ? { ...acc, isActivated: true } : acc
      );
      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async updateSettings(settings: Partial<XTSettings>) {
    return withError('Failed to update settings', async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async signumEncrypt(accPublicKey: string, plainMessage: string, recipientPublicKey: string, isText: boolean) {
    return withError('Failed to encrypt', async () => {
      const { p2pEncryptionKey } = await this.getSignumTxKeys(accPublicKey);
      return isText
        ? encryptMessage(plainMessage, recipientPublicKey, p2pEncryptionKey)
        : encryptData(Buffer.from(plainMessage, 'hex'), recipientPublicKey, p2pEncryptionKey);
    });
  }

  async signumDecrypt(accPublicKey: string, encryptedMessage: EncryptedMessage, senderPublicKey: string) {
    return withError('Failed to decrypt', async () => {
      const { p2pEncryptionKey } = await this.getSignumTxKeys(accPublicKey);
      return encryptedMessage.isText
        ? decryptMessage(encryptedMessage, senderPublicKey, p2pEncryptionKey)
        : Buffer.from(
            decryptData(
              {
                data: Buffer.from(encryptedMessage.data, 'hex'),
                nonce: Buffer.from(encryptedMessage.nonce, 'hex')
              },
              senderPublicKey,
              p2pEncryptionKey
            )
          ).toString('hex');
    });
  }

  async signumSign(accPublicKey: string, unsignedTransactionBytes: string) {
    return withError('Failed to sign', async () => {
      const { publicKey, signingKey } = await this.getSignumTxKeys(accPublicKey);
      const signature = generateSignature(unsignedTransactionBytes, signingKey);
      if (!verifySignature(signature, unsignedTransactionBytes, publicKey)) {
        throw new Error('The signed message could not be verified');
      }
      return generateSignedTransactionBytes(unsignedTransactionBytes, signature);
    });
  }

  async signNostrEvent(signumPublicKey: string, event: any) {
    return withError('Failed to sign nostr Event', async () => {
      const privateKey = await this.getNostrPrivateKeyFromSignumPublicKey(signumPublicKey);
      return signNostrEvent(privateKey, event);
    });
  }

  async encryptNostrMessage(signumPublicKey: string, peerPubKey: string, plaintext: string) {
    return withError('Failed to encrypt nostr Message', async () => {
      const privateKey = await this.getNostrPrivateKeyFromSignumPublicKey(signumPublicKey);
      return encryptNostrMessage(privateKey, peerPubKey, plaintext);
    });
  }

  async decryptNostrMessage(signumPublicKey: string, peerPubKey: string, cipherText: string) {
    return withError('Failed to decrypt nostr Message', async () => {
      const privateKey = await this.getNostrPrivateKeyFromSignumPublicKey(signumPublicKey);
      return decryptNostrMessage(privateKey, peerPubKey, cipherText);
    });
  }

  async getNostrPrivateKeyFromSignumPublicKey(signumPublicKey: string) {
    return withError('Failed to fetch Nostr private key', () => {
      const accountId = Address.fromPublicKey(signumPublicKey).getNumericId();
      return fetchAndDecryptOne<string>(nostrPrivKeyStrgKey(accountId), this.passKey);
    });
  }

  async getSignumTxKeys(accPublicKey: string) {
    return withError('Failed to fetch the signing keys - Do you use a Watch Only Account?', async () => {
      const accountId = Address.fromPublicKey(accPublicKey).getNumericId();

      const [signingKey, p2pEncryptionKey, publicKey] = await Promise.all([
        fetchAndDecryptOne<string>(accPrivKeyStrgKey(accountId), this.passKey),
        fetchAndDecryptOne<string>(accPrivP2PStrgKey(accountId), this.passKey),
        fetchAndDecryptOne<string>(accPubKeyStrgKey(accountId), this.passKey)
      ]);
      return {
        signingKey,
        p2pEncryptionKey,
        publicKey
      };
    });
  }
}

/**
 * Misc
 */

function generateCheck() {
  const values = crypto.getRandomValues(new Uint8Array(64));
  return convertByteArrayToHexString(values);
}

function concatAccount(current: XTAccount[], newOne: XTAccount) {
  if (current.every(a => a.publicKey !== newOne.publicKey)) {
    return [...current, newOne];
  }

  throw new PublicError('Account already exists');
}

function getNewAccountName(allAccounts: XTAccount[], templateI18nKey = 'defaultAccountName') {
  return `Account ${allAccounts.length + 1}`;
}

// async function createMemorySigner(privateKey: string, encPassword?: string) {
//   return InMemorySigner.fromSecretKey(privateKey, encPassword);
// }

function createStorageKey(id: StorageEntity) {
  return combineStorageKey(STORAGE_KEY_PREFIX, id);
}

function createDynamicStorageKey(id: StorageEntity) {
  const keyBase = combineStorageKey(STORAGE_KEY_PREFIX, id);
  return (...subKeys: (number | string)[]) => combineStorageKey(keyBase, ...subKeys);
}

function combineStorageKey(...parts: (string | number)[]) {
  return parts.join('_');
}

async function withError<T>(errMessage: string, factory: (doThrow: () => void) => Promise<T>) {
  try {
    return await factory(() => {
      throw new Error('<stub>');
    });
  } catch (err: any) {
    throw err instanceof PublicError ? err : new PublicError(errMessage);
  }
}
