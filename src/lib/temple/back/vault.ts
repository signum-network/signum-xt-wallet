import { Address } from '@signumjs/core';
import {
  generateMasterKeys,
  generateSignature,
  generateSignedTransactionBytes,
  Keys,
  verifySignature
} from '@signumjs/crypto';
import { convertByteArrayToHexString } from '@signumjs/util';
import { InMemorySigner } from '@taquito/signer';
import * as TaquitoUtils from '@taquito/utils';
import * as Bip39 from 'bip39';

import { PublicError } from 'lib/temple/back/defaults';
import { encryptAndSaveMany, fetchAndDecryptOne, isStored, removeMany } from 'lib/temple/back/safe-storage';
import * as Passworder from 'lib/temple/passworder';
import { clearStorage } from 'lib/temple/reset';
import { TempleAccount, TempleAccountType, TempleSettings } from 'lib/temple/types';

import { generateSignumMnemonic } from '../signumMnemonic';

const STORAGE_KEY_PREFIX = 'vault';
const DEFAULT_SETTINGS: TempleSettings = {};

enum StorageEntity {
  Check = 'check',
  MigrationLevel = 'migration',
  Mnemonic = 'mnemonic',
  AccPrivKey = 'accprivkey',
  AccPrivP2PKey = 'accprivp2pkey',
  AccPubKey = 'accpubkey',
  Accounts = 'accounts',
  Settings = 'settings'
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivP2PStrgKey = createDynamicStorageKey(StorageEntity.AccPrivP2PKey);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
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
      const initialAccount: TempleAccount = {
        type: TempleAccountType.Imported,
        name: 'Account 1',
        publicKeyHash: accountId
      };
      const newAccounts = [initialAccount];
      const passKey = await Passworder.generateKey(password);
      await clearStorage();
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

  // TODO: remove not used
  static async revealMnemonic(password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', () => fetchAndDecryptOne<string>(mnemonicStrgKey, passKey));
  }

  // TODO: remove not used
  static async revealPrivateKey(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal private key', async () => {
      const privateKeySeed = await fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), passKey);
      const signer = await createMemorySigner(privateKeySeed);
      return signer.secretKey();
    });
  }

  static async removeAccount(accPublicKeyHash: string, password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to remove account', async doThrow => {
      const allAccounts = await fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, passKey);
      if (allAccounts.length === 1) {
        doThrow();
      }
      const acc = allAccounts.find(a => a.publicKeyHash === accPublicKeyHash);
      if (!acc || acc.type === TempleAccountType.HD) {
        doThrow();
      }

      const newAllAcounts = allAccounts.filter(acc => acc.publicKeyHash !== accPublicKeyHash);
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], passKey);

      await removeMany([accPrivKeyStrgKey(accPublicKeyHash), accPubKeyStrgKey(accPublicKeyHash)]);

      return newAllAcounts;
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

  revealPublicKey(accPublicKeyHash: string) {
    return withError('Failed to reveal public key', () =>
      fetchAndDecryptOne<string>(accPubKeyStrgKey(accPublicKeyHash), this.passKey)
    );
  }

  fetchAccounts() {
    return fetchAndDecryptOne<TempleAccount[]>(accountsStrgKey, this.passKey);
  }

  async fetchSettings() {
    let saved;
    try {
      saved = await fetchAndDecryptOne<TempleSettings>(settingsStrgKey, this.passKey);
    } catch {}
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  async createSignumAccount(name?: string, hdAccIndex?: number): Promise<[string, TempleAccount[]]> {
    return withError('Failed to create account', async () => {
      const allAccounts = await this.fetchAccounts();
      const mnemonic = await generateSignumMnemonic();
      const keys = generateMasterKeys(mnemonic);
      const accountId = Address.fromPublicKey(keys.publicKey).getNumericId();
      const accName = name || getNewAccountName(allAccounts);
      const newAccount: TempleAccount = {
        type: TempleAccountType.Imported,
        name: accName,
        publicKeyHash: accountId
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

  async importAccount(accPrivateKey: string, encPassword?: string) {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();
      const signer = await createMemorySigner(accPrivateKey, encPassword);
      const [realAccPrivateKey, accPublicKey, accPublicKeyHash] = await Promise.all([
        signer.secretKey(),
        signer.publicKey(),
        signer.publicKeyHash()
      ]);

      const newAccount: TempleAccount = {
        type: TempleAccountType.Imported,
        name: getNewAccountName(allAccounts),
        publicKeyHash: accPublicKeyHash
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivKeyStrgKey(accPublicKeyHash), realAccPrivateKey],
          [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importAccountSignum(keys: Keys, name?: string): Promise<TempleAccount[]> {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';

    return withError(errMessage, async () => {
      const allAccounts = await this.fetchAccounts();
      const accountId = Address.fromPublicKey(keys.publicKey).getNumericId();
      const newAccount: TempleAccount = {
        type: TempleAccountType.Imported,
        name: name || getNewAccountName(allAccounts),
        publicKeyHash: accountId
      };

      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPrivP2PStrgKey(accountId), keys.agreementPrivateKey],
          [accPrivKeyStrgKey(accountId), keys.signPrivateKey],
          [accPubKeyStrgKey(accountId), keys.publicKey],
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importMnemonicAccount(passphrase: string, name?: string) {
    return withError('Failed to import account', async () => {
      try {
        const keys = generateMasterKeys(passphrase);
        return this.importAccountSignum(keys, name);
      } catch (_err) {
        throw new PublicError('Invalid Mnemonic or Password');
      }
    });
  }

  // TODO: remove, we dont have it
  async importFundraiserAccount(email: string, password: string, mnemonic: string) {
    return withError('Failed to import fundraiser account', async () => {
      const seed = Bip39.mnemonicToSeedSync(mnemonic, `${email}${password}`);
      const privateKey = seedToPrivateKey(seed);
      return this.importAccount(privateKey);
    });
  }

  // TODO: remove we don't have it
  async importManagedKTAccount(accPublicKeyHash: string, chainId: string, owner: string) {
    return withError('Failed to import Managed KT account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.ManagedKT,
        name: getNewAccountName(
          allAccounts.filter(({ type }) => type === TempleAccountType.ManagedKT),
          'defaultManagedKTAccountName'
        ),
        publicKeyHash: accPublicKeyHash,
        chainId,
        owner
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async importWatchOnlyAccount(accPublicKeyHash: string, chainId?: string) {
    return withError('Failed to import Watch Only account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newAccount: TempleAccount = {
        type: TempleAccountType.WatchOnly,
        name: getNewAccountName(
          allAccounts.filter(({ type }) => type === TempleAccountType.WatchOnly),
          'defaultWatchOnlyAccountName'
        ),
        publicKeyHash: accPublicKeyHash,
        chainId
      };
      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  // async createLedgerAccount(name: string, derivationPath?: string, derivationType?: DerivationType) {
  //   return withError('Failed to connect Ledger account', async () => {
  //     if (!derivationPath) derivationPath = getMainDerivationPath(0);
  //
  //     const { signer, cleanup } = await createLedgerSigner(derivationPath, derivationType);
  //
  //     try {
  //       const accPublicKey = await signer.publicKey();
  //       const accPublicKeyHash = await signer.publicKeyHash();
  //
  //       const newAccount: TempleAccount = {
  //         type: TempleAccountType.Ledger,
  //         name,
  //         publicKeyHash: accPublicKeyHash,
  //         derivationPath,
  //         derivationType
  //       };
  //       const allAccounts = await this.fetchAccounts();
  //       const newAllAcounts = concatAccount(allAccounts, newAccount);
  //
  //       await encryptAndSaveMany(
  //         [
  //           [accPubKeyStrgKey(accPublicKeyHash), accPublicKey],
  //           [accountsStrgKey, newAllAcounts]
  //         ],
  //         this.passKey
  //       );
  //
  //       return newAllAcounts;
  //     } finally {
  //       cleanup();
  //     }
  //   });
  // }

  async editAccountName(accPublicKeyHash: string, name: string) {
    return withError('Failed to edit account name', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKeyHash === accPublicKeyHash)) {
        throw new PublicError('Account not found');
      }

      if (allAccounts.some(acc => acc.publicKeyHash !== accPublicKeyHash && acc.name === name)) {
        throw new PublicError('Account with same name already exist');
      }

      const newAllAcounts = allAccounts.map(acc => (acc.publicKeyHash === accPublicKeyHash ? { ...acc, name } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAcounts]], this.passKey);

      return newAllAcounts;
    });
  }

  async setAccountIsActivated(accPublicKeyHash: string) {
    return withError('Failed to update account', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKeyHash === accPublicKeyHash)) {
        throw new PublicError('Account not found');
      }
      const newAllAccounts = allAccounts.map(acc =>
        acc.publicKeyHash === accPublicKeyHash ? { ...acc, isActivated: true } : acc
      );
      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      return newAllAccounts;
    });
  }

  async updateSettings(settings: Partial<TempleSettings>) {
    return withError('Failed to update settings', async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async signumSign(accPublicKeyHash: string, unsignedTransactionBytes: string) {
    return withError('Failed to sign', async () => {
      const { publicKey, signingKey } = await this.getSignumTxKeys(accPublicKeyHash);
      const signature = generateSignature(unsignedTransactionBytes, signingKey);
      if (!verifySignature(signature, unsignedTransactionBytes, publicKey)) {
        throw new Error('The signed message could not be verified');
      }
      return generateSignedTransactionBytes(unsignedTransactionBytes, signature);
    });
  }

  // TODO: Remove this obsolete method
  async sendOperations(accPublicKeyHash: string, rpc: string, opParams: any[]) {
    return Promise.reject('Method not supported');
  }

  async getSignumTxKeys(accPublicKeyHash: string) {
    return withError('Failed to fetch Signum transaction keys', async () => {
      const [signingKey, publicKey] = await Promise.all([
        fetchAndDecryptOne<string>(accPrivKeyStrgKey(accPublicKeyHash), this.passKey),
        fetchAndDecryptOne<string>(accPubKeyStrgKey(accPublicKeyHash), this.passKey)
      ]);
      return {
        signingKey,
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

function concatAccount(current: TempleAccount[], newOne: TempleAccount) {
  if (current.every(a => a.publicKeyHash !== newOne.publicKeyHash)) {
    return [...current, newOne];
  }

  throw new PublicError('Account already exists');
}

function getNewAccountName(allAccounts: TempleAccount[], templateI18nKey = 'defaultAccountName') {
  return `Account ${allAccounts.length + 1}`;
}

async function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

function seedToPrivateKey(seed: Buffer) {
  return TaquitoUtils.b58cencode(seed.slice(0, 32), TaquitoUtils.prefix.edsk2);
}

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
