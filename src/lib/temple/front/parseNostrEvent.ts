import { Event as NostrEvent } from 'nostr-tools';

import { getNostrEventName } from 'lib/nostr';

export interface ParsedNostrEvent extends NostrEvent {
  kindName: string;
}

export function parseNostrEvent(e: any): ParsedNostrEvent {
  return {
    ...e,
    kindName: getNostrEventName(e.kind)
  };
}
