import browser from 'webextension-polyfill';

import {
  NostrExtensionErrorType,
  NostrExtensionGetRelaysRequest,
  NostrExtensionGetRelaysResponse,
  NostrExtensionMessageType
} from 'lib/intercom/nostr/typings';
import { NostrRelays } from 'lib/messaging';

import { getDApp } from '../dapp';

export async function getRelays(
  origin: string,
  req: NostrExtensionGetRelaysRequest
): Promise<NostrExtensionGetRelaysResponse> {
  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(NostrExtensionErrorType.NotGranted);
  }
  const { nostr_relays_snapshot } = await browser.storage.local.get('nostr_relays_snapshot');

  return {
    type: NostrExtensionMessageType.GetRelaysResponse,
    relays: (nostr_relays_snapshot as NostrRelays) || {}
  };
}
