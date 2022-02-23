import { TezosOperationError } from '@taquito/taquito';
import browser, { Runtime } from 'webextension-polyfill';

import { createQueue } from 'lib/queue';
import { addLocalOperation } from 'lib/temple/activity';
import { intercom } from 'lib/temple/back/defaults';
import { buildFinalOpParmas, dryRunOpParams } from 'lib/temple/back/dryrun';
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
} from 'lib/temple/back/store';
import { Vault } from 'lib/temple/back/vault';
import { loadChainId } from 'lib/temple/helpers';
import {
  TempleState,
  TempleMessageType,
  TempleRequest,
  TempleSettings,
  TempleSharedStorageKey
} from 'lib/temple/types';

import { getCurrentPermission, requestPermission, requestSign, getAllDApps, removeDApp } from './dapp';
import { ExtensionMessageType, ExtensionRequest, ExtensionResponse } from './dapp/typings';

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;
const AUTODECLINE_AFTER = 60_000;

const enqueueUnlock = createQueue();

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<TempleState> {
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

export function revealPrivateKey(accPublicKeyHash: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKeyHash, password));
}

export function revealPublicKey(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKeyHash));
}

export function removeAccount(accPublicKeyHash: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(accPublicKeyHash, password);
    accountsUpdated(updatedAccounts);
  });
}

export function editAccountName(accPublicKeyHash: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error('Invalid name. It should be: 1-16 characters, without special');
    }

    const updatedAccounts = await vault.editAccountName(accPublicKeyHash, name);
    accountsUpdated(updatedAccounts);
  });
}

export function setAccountActivated(accPublicKeyHash: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.setAccountIsActivated(accPublicKeyHash);
    accountsUpdated(updatedAccounts);
  });
}

export function importAccount(privateKey: string, encPassword?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccount(privateKey, encPassword);
    accountsUpdated(updatedAccounts);
  });
}

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
//
// export function craeteLedgerAccount(name: string, derivationPath?: string, derivationType?: DerivationType) {
//   return withUnlocked(async ({ vault }) => {
//     const updatedAccounts = await vault.createLedgerAccount(name, derivationPath, derivationType);
//     accountsUpdated(updatedAccounts);
//   });
// }

export function updateSettings(settings: Partial<TempleSettings>) {
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

export function getSignumTxKeys(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.getSignumTxKeys(accPublicKeyHash));
}

// ---------------------------------------------------------

export function sendOperations(
  port: Runtime.Port,
  id: string,
  sourcePkh: string,
  networkRpc: string,
  opParams: any[]
): Promise<{ opHash: string }> {
  return withUnlocked(async () => {
    const sourcePublicKey = await revealPublicKey(sourcePkh);
    const dryRunResult = await dryRunOpParams({
      opParams,
      networkRpc,
      sourcePkh,
      sourcePublicKey
    });
    if (dryRunResult) {
      opParams = dryRunResult.opParams;
    }

    return new Promise(async (resolve, reject) => {
      intercom.notify(port, {
        type: TempleMessageType.ConfirmationRequested,
        id,
        payload: {
          type: 'operations',
          sourcePkh,
          networkRpc,
          opParams,
          ...(dryRunResult ?? {})
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
            type: TempleMessageType.ConfirmationExpired,
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
        if (reqPort === port && req?.type === TempleMessageType.ConfirmationRequest && req?.id === id) {
          if (req.confirmed) {
            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendOperations(
                  sourcePkh,
                  networkRpc,
                  buildFinalOpParmas(opParams, req.modifiedTotalFee, req.modifiedStorageLimit)
                )
              );

              try {
                const chainId = await loadChainId(networkRpc);
                await addLocalOperation(chainId, op.hash, op.results);
              } catch {}

              resolve({ opHash: op.hash });
            } catch (err: any) {
              if (err instanceof TezosOperationError) {
                reject(err);
              } else {
                throw err;
              }
            }
          } else {
            decline();
          }

          close();

          return {
            type: TempleMessageType.ConfirmationResponse
          };
        }
        return;
      });

      const stopDisconnectListening = intercom.onDisconnect(port, declineAndClose);

      // Decline after timeout
      const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
      const stopTimeout = () => clearTimeout(t);
    });
  });
}

export function sign(port: Runtime.Port, id: string, sourcePkh: string, bytes: string, watermark?: string) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.notify(port, {
          type: TempleMessageType.ConfirmationRequested,
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
              type: TempleMessageType.ConfirmationExpired,
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
          if (reqPort === port && req?.type === TempleMessageType.ConfirmationRequest && req?.id === id) {
            if (req.confirmed) {
              const result = await withUnlocked(({ vault }) => vault.signumSign(sourcePkh, bytes));
              resolve(result);
            } else {
              decline();
            }

            close();

            return {
              type: TempleMessageType.ConfirmationResponse
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

    // TODO: seems that signum does not need this
    // case TempleDAppMessageType.OperationRequest:
    //   return withInited(() => enqueueDApp(() => requestOperation(origin, req)));

    case ExtensionMessageType.SignRequest:
      return withInited(() => requestSign(origin, req));

    // TODO: seems that signum does not need this
    // case TempleDAppMessageType.BroadcastRequest:
    //   return withInited(() => requestBroadcast(origin, req));
  }
}

async function createCustomNetworksSnapshot(settings: TempleSettings) {
  try {
    if (settings.customNetworks) {
      await browser.storage.local.set({
        custom_networks_snapshot: settings.customNetworks
      });
    }
  } catch {}
}
