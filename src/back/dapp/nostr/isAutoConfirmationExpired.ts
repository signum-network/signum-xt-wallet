import browser from 'webextension-polyfill';

export async function isAutoConfirmationExpired() {
  // see AutoConfirmationSelect.tsx
  const { nostr_confirmation_timeout } = await browser.storage.local.get('nostr_confirmation_timeout');

  if (!nostr_confirmation_timeout) {
    return true;
  }
  const { started = 0, timeout = 0 } = nostr_confirmation_timeout;
  const elapsed = Math.floor(Date.now() / 1000) - started;

  if (elapsed > timeout) {
    // reset it
    await browser.storage.local.set({ nostr_confirmation_timeout: { started: 0, timeout: 0 } });
  }

  return elapsed > timeout;
}
