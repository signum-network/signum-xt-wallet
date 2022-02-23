import { TempleSharedStorageKey } from 'lib/messaging';

export async function isLedgerLiveEnabledByDefault() {
  return process.env.TARGET_BROWSER === 'chrome';
}

export async function isLedgerLiveEnabled() {
  return (
    localStorage.getItem(TempleSharedStorageKey.UseLedgerLive) === 'true' || (await isLedgerLiveEnabledByDefault())
  );
}
