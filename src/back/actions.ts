import browser, { Runtime } from 'webextension-polyfill';

import { NostrExtensionMessageType, NostrExtensionRequest, NostrExtensionResponse } from 'lib/intercom/nostr/typings';
import { AppState, TempleRequest, XTMessageType, XTSettings, XTSharedStorageKey } from 'lib/messaging';
import { createQueue } from 'lib/queue';
import { fetchKnownNetworks } from 'lib/temple/networks';

import { MenuItems, setMenuItemEnabled } from './context-menus';
import * as SignumDApp from './dapp';
import * as NostrDApp from './dapp/nostr';
import { ExtensionMessageType, ExtensionRequest, ExtensionResponse } from './dapp/typings';
import { intercom } from './defaults';
import {
  accountsUpdated,
  inited,
  locked,
  networksUpdated,
  settingsUpdated,
  store,
  toFront,
  unlocked,
  withInited,
  withUnlocked
} from './store';
import { Vault } from './vault';

const NaiveAddressCheck = /^(S|TS)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;

function isSignumAddress(selection: string) {
  return (
    (selection.length === 22 || selection.length === 23) && // fast check
    NaiveAddressCheck.test(selection)
  );
}

export async function handlePageTextSelected(origin: string, selectedText: string) {
  const enabled = isSignumAddress(selectedText.trim());

  await Promise.all([
    setMenuItemEnabled(MenuItems.SendToAddress, enabled),
    setMenuItemEnabled(MenuItems.OpenInExplorer, enabled)
  ]);

  await browser.storage.local.set({ [XTSharedStorageKey.SelectedText]: enabled ? selectedText : '' });
}

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;
const AUTODECLINE_AFTER = 60_000;

const enqueueUnlock = createQueue();

export async function init() {
  const [vaultExist, networks] = await Promise.all([Vault.isExist(), fetchKnownNetworks()]);
  await browser.storage.local.set({ networks });
  networksUpdated(networks);
  inited({
    inited: vaultExist,
    networks
  });
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
      const key = XTSharedStorageKey.DAppEnabled;
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

export function revealPublicKey(accPublicKey: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKey));
}

export function revealNostrPrivateKey(accPublicKey: string, password: string) {
  return withUnlocked(() => Vault.revealNostrPrivateKey(accPublicKey, password));
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

export function importMnemonicAccount(mnemonic: string, name?: string, withNostr?: boolean) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(mnemonic, name, withNostr);
    accountsUpdated(updatedAccounts);
  });
}

export function importAccountFromNostrPrivateKey(nsecOrHex: string, name?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccountFromNostrPrivKey(nsecOrHex, name);
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
    createNostrRelaysSnapshot(updatedSettings);
    settingsUpdated(updatedSettings);
  });
}

export function getAllDAppSessions() {
  return SignumDApp.getAllDApps();
}

export function removeDAppSession(origin: string) {
  return SignumDApp.removeDApp(origin);
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

export async function processDApp(
  origin: string,
  req: NostrExtensionRequest | ExtensionRequest
): Promise<NostrExtensionResponse | ExtensionResponse | void> {
  switch (req?.type) {
    case ExtensionMessageType.GetCurrentPermissionRequest:
      return withInited(() => SignumDApp.getCurrentPermission(origin));

    case ExtensionMessageType.PermissionRequest:
      return withInited(() => SignumDApp.requestPermission(origin, req));

    case ExtensionMessageType.SignRequest:
      return withInited(() => SignumDApp.requestSign(origin, req));

    case ExtensionMessageType.SendEncryptedMessageRequest:
      return withInited(() => SignumDApp.requestSendEncryptedMessage(origin, req));

    case ExtensionMessageType.MessageEncryptRequest:
      return withInited(() => SignumDApp.requestEncryptMessage(origin, req));

    case ExtensionMessageType.MessageDecryptRequest:
      return withInited(() => SignumDApp.requestDecryptMessage(origin, req));

    case NostrExtensionMessageType.GetPublicKeyRequest:
      return withInited(() => NostrDApp.getPublicKey(origin, req));

    case NostrExtensionMessageType.GetRelaysRequest:
      return withInited(() => NostrDApp.getRelays(origin, req));

    case NostrExtensionMessageType.SignRequest:
      return withInited(() => NostrDApp.requestSignEvent(origin, req));

    case NostrExtensionMessageType.EncryptMessageRequest:
      return withInited(() => NostrDApp.requestEncryptMessage(origin, req));

    case NostrExtensionMessageType.DecryptMessageRequest:
      return withInited(() => NostrDApp.requestDecryptMessage(origin, req));
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

async function createNostrRelaysSnapshot(settings: XTSettings) {
  try {
    if (settings.nostrRelays) {
      await browser.storage.local.set({
        nostr_relays_snapshot: settings.nostrRelays
      });
    }
  } catch {}
}
