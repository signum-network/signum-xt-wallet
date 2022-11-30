import { sanitizeUrl } from '@braintree/sanitize-url';
import { LedgerClientFactory } from '@signumjs/core';
import { URIResolver } from '@signumjs/standards';
import browser, { WebNavigation } from 'webextension-polyfill';

import { getCurrentNetworkHost } from './dapp';

function findSRC47URI(url: URL): string {
  // @ts-ignore
  const resolver = new URIResolver(null);
  const parse = (str: string) => {
    try {
      resolver.parseURI(str);
      return str;
    } catch (e: any) {
      /// ignore - not valid uri
      return '';
    }
  };
  const uri = parse(url.host);
  if (!uri) {
    const search = url.searchParams;
    for (let [, value] of search) {
      const validURI = parse(value);
      if (validURI) return validURI;
    }
  }
  return '';
}

async function handleBeforeNavigate(details: WebNavigation.OnBeforeNavigateDetailsType) {
  if (details.frameId > 0) return;
  try {
    const foundURI = findSRC47URI(new URL(details.url));
    if (!foundURI) return;
    const { rpcBaseURL: nodeHost } = await getCurrentNetworkHost();
    const resolver = new URIResolver(LedgerClientFactory.createClient({ nodeHost }));
    const resolved = await resolver.resolve(foundURI);
    if (typeof resolved !== 'string') return;
    new URL(resolved); // throws on invalid URL
    const url = sanitizeUrl(resolved);
    console.debug('SRC47 URI found and resolved to:', url);
    await browser.tabs.update({ url });
  } catch (e: any) {
    // no op
  }
}

export function initSrc47Resolver() {
  browser.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
}
