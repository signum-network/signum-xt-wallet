import browser, { Runtime } from 'webextension-polyfill';

import { AppState, XTMessageType, TempleRequest, XTSettings, TempleSharedStorageKey } from 'lib/messaging';
import { createQueue } from 'lib/queue';

import { getCurrentPermission, requestPermission, requestSign, getAllDApps, removeDApp } from './dapp';
import { requestSendEncryptedMessage } from './dapp/requestSendEncryptedMessage';
import { ExtensionMessageType, ExtensionRequest, ExtensionResponse } from './dapp/typings';
import { intercom } from './defaults';
import {
  toFront,
  store,
  inited,
  locked,
  unlocked,
  accountsUpdated,
  settingsUpdated,
  withInited,
  withUnlocked
} from './store';
import { Vault } from './vault';

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;
const AUTODECLINE_AFTER = 60_000;

const enqueueUnlock = createQueue();

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<AppState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise(r => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function isDAppEnabled() {
  const bools = await Promise.all([
    Vault.isExist(),
    (async () => {
      const key = TempleSharedStorageKey.DAppEnabled;
      const items = await browser.storage.local.get([key]);
      return key in items ? items[key] : true;
    })()
  ]);

  return bools.every(Boolean);
}

export function registerNewWallet(password: string, mnemonic?: string) {
  return withInited(async () => {
    await Vault.registerNewWallet(password, mnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {
  return withInited(() =>
    enqueueUnlock(async () => {
      const vault = await Vault.setup(password);
      const accounts = await vault.fetchAccounts();
      const settings = await vault.fetchSettings();
      unlocked({ vault, accounts, settings });
    })
  );
}

export function createAccount(name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error('Invalid name. It should be: 1-16 characters, without special');
      }
    }

    const [mnemonic, updatedAccounts] = await vault.createSignumAccount(name);
    accountsUpdated(updatedAccounts);
    return mnemonic;
  });
}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function revealPrivateKey(accPublicKey: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKey, password));
}

export function revealPublicKey(accPublicKey: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKey));
}

export function removeAccount(accPublicKey: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(accPublicKey, password);
    accountsUpdated(updatedAccounts);
  });
}

export function editAccountName(accPublicKey: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error('Invalid name. It should be: 1-16 characters, without special');
    }

    const updatedAccounts = await vault.editAccountName(accPublicKey, name);
    accountsUpdated(updatedAccounts);
  });
}

export function setAccountActivated(accPublicKey: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.setAccountIsActivated(accPublicKey);
    accountsUpdated(updatedAccounts);
  });
}

// export function importAccount(privateKey: string, encPassword?: string) {
//   return withUnlocked(async ({ vault }) => {
//     const updatedAccounts = await vault.importAccount(privateKey, encPassword);
//     accountsUpdated(updatedAccounts);
//   });
// }

export function importMnemonicAccount(mnemonic: string, name?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(mnemonic, name);
    accountsUpdated(updatedAccounts);
  });
}

export function importFundraiserAccount(email: string, password: string, mnemonic: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importFundraiserAccount(email, password, mnemonic);
    accountsUpdated(updatedAccounts);
  });
}

export function importManagedKTAccount(address: string, chainId: string, owner: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importManagedKTAccount(address, chainId, owner);
    accountsUpdated(updatedAccounts);
  });
}

export function importWatchOnlyAccount(address: string, chainId?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importWatchOnlyAccount(address, chainId);
    accountsUpdated(updatedAccounts);
  });
}

export function updateSettings(settings: Partial<XTSettings>) {
  return withUnlocked(async ({ vault }) => {
    const updatedSettings = await vault.updateSettings(settings);
    createCustomNetworksSnapshot(updatedSettings);
    settingsUpdated(updatedSettings);
  });
}

export function getAllDAppSessions() {
  return getAllDApps();
}

export function removeDAppSession(origin: string) {
  return removeDApp(origin);
}

export function getSignumTxKeys(accPublicKey: string) {
  return withUnlocked(({ vault }) => vault.getSignumTxKeys(accPublicKey));
}

// ---------------------------------------------------------
export function sign(port: Runtime.Port, id: string, sourcePkh: string, bytes: string, watermark?: string) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.notify(port, {
          type: XTMessageType.ConfirmationRequested,
          id,
          payload: {
            type: 'sign',
            sourcePkh,
            bytes,
            watermark
          }
        });

        let closing = false;
        const close = () => {
          if (closing) return;
          closing = true;

          try {
            stopTimeout();
            stopRequestListening();
            stopDisconnectListening();

            intercom.notify(port, {
              type: XTMessageType.ConfirmationExpired,
              id
            });
          } catch (_err) {}
        };

        const decline = () => {
          reject(new Error('Declined'));
        };
        const declineAndClose = () => {
          decline();
          close();
        };

        const stopRequestListening = intercom.onRequest(async (req: TempleRequest, reqPort) => {
          if (reqPort === port && req?.type === XTMessageType.ConfirmationRequest && req?.id === id) {
            if (req.confirmed) {
              const result = await withUnlocked(({ vault }) => vault.signumSign(sourcePkh, bytes));
              resolve(result);
            } else {
              decline();
            }

            close();

            return {
              type: XTMessageType.ConfirmationResponse
            };
          }
          return;
        });

        const stopDisconnectListening = intercom.onDisconnect(port, declineAndClose);

        // Decline after timeout
        const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
        const stopTimeout = () => clearTimeout(t);
      })
  );
}

export async function processDApp(origin: string, req: ExtensionRequest): Promise<ExtensionResponse | void> {
  switch (req?.type) {
    case ExtensionMessageType.GetCurrentPermissionRequest:
      return withInited(() => getCurrentPermission(origin));

    case ExtensionMessageType.PermissionRequest:
      return withInited(() => requestPermission(origin, req));

    case ExtensionMessageType.SignRequest:
      return withInited(() => requestSign(origin, req));

    case ExtensionMessageType.SendEncryptedMessageRequest:
      return withInited(() => requestSendEncryptedMessage(origin, req));
  }
}

async function createCustomNetworksSnapshot(settings: XTSettings) {
  try {
    if (settings.customNetworks) {
      await browser.storage.local.set({
        custom_networks_snapshot: settings.customNetworks
      });
    }
  } catch {}
}
