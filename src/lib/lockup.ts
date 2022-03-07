import { storage } from 'webextension-polyfill';
const LockupStorageKey = 'lock_up';
const ConnectionStorageKey = 'connection';

export async function setLockUpEnabled(enabled: boolean) {
  return storage.local.set({ [LockupStorageKey]: enabled });
}

export async function getLockUpEnabled(): Promise<boolean> {
  const enabled = await storage.local.get(LockupStorageKey);
  return enabled[LockupStorageKey] !== undefined ? !!enabled[LockupStorageKey] : true;
}

export interface ConnectionControl {
  count: number;
  disconnectTimestamp: number;
}

export async function updateConnectionControl(connection: ConnectionControl) {
  return storage.local.set({ [ConnectionStorageKey]: connection });
}

export async function getConnectionControl(): Promise<ConnectionControl> {
  const connection = await storage.local.get(ConnectionStorageKey);
  const value = connection[ConnectionStorageKey];
  return value !== undefined
    ? value
    : {
        count: 0,
        disconnectTimestamp: 0
      };
}
