import { createStore, createEvent } from 'effector';

import { AppState, Network, WalletStatus, XTAccount, XTSettings } from 'lib/messaging';

import { Vault } from './vault';

export interface StoreState extends AppState {
  inited: boolean;
  vault: Vault | null;
}

export interface UnlockedStoreState extends StoreState {
  vault: Vault;
}

export function toFront({ status, accounts, networks, settings }: StoreState): AppState {
  return {
    status,
    accounts,
    networks,
    settings
  };
}

/**
 * Events
 */

export const inited = createEvent<{ inited: boolean; networks: Network[] }>('Inited');

export const locked = createEvent('Locked');

export const unlocked = createEvent<{
  vault: Vault;
  accounts: XTAccount[];
  settings: XTSettings;
}>('Unlocked');

export const accountsUpdated = createEvent<XTAccount[]>('Accounts updated');

export const settingsUpdated = createEvent<XTSettings>('Settings updated');

export const networksUpdated = createEvent<Network[]>('Networks updated');

/**
 * Store
 */

export const store = createStore<StoreState>({
  inited: false,
  vault: null,
  status: WalletStatus.Idle,
  accounts: [],
  networks: [],
  settings: null
})
  .on(inited, (state, { inited, networks }) => ({
    ...state,
    inited,
    status: inited ? WalletStatus.Locked : WalletStatus.Idle,
    networks: inited ? networks : []
  }))
  .on(locked, ({ networks }) => ({
    // Attention!
    // Security stuff!
    // Don't merge new state to existing!
    // Build a new state from scratch
    // Reset all user specific properties
    inited: true,
    vault: null,
    status: WalletStatus.Locked,
    accounts: [],
    settings: null,
    networks // are public anyways!
  }))
  .on(unlocked, (state, { vault, accounts, settings }) => ({
    ...state,
    vault,
    status: WalletStatus.Ready,
    accounts,
    settings
  }))
  .on(accountsUpdated, (state, accounts) => ({
    ...state,
    accounts
  }))
  .on(settingsUpdated, (state, settings) => ({
    ...state,
    settings
  }));

/**
 * Helpers
 */

export function withUnlocked<T>(factory: (state: UnlockedStoreState) => T) {
  const state = store.getState();
  assertUnlocked(state);
  return factory(state);
}

export function withInited<T>(factory: (state: StoreState) => T) {
  const state = store.getState();
  assertInited(state);
  return factory(state);
}

export function assertUnlocked(state: StoreState): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== WalletStatus.Ready) {
    throw new Error('Not ready');
  }
}

export function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error('Not initialized');
  }
}
