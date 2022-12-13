import { sanitizeUrl } from '@braintree/sanitize-url';
import { URIResolver } from '@signumjs/standards';
import browser, { WebNavigation, WebRequest } from 'webextension-polyfill';

import { getCurrentNetworkHost } from './dapp';

function findSRC47URI(url: URL): string {
  const parse = (str: string) => {
    try {
      str = str.endsWith('/') ? str.substring(0, str.length - 1) : str;
      URIResolver.parseURI(str);
      return str;
    } catch (e: any) {
      /// ignore - not valid uri
      return '';
    }
  };
  const uri = parse(url.origin);
  if (!uri) {
    const search = url.searchParams;
    for (let [, value] of search) {
      const validURI = parse(value);
      if (validURI) return validURI;
    }
  }
  return uri;
}

// Service Workers can only use fetch api.... SignumJS legder uses Axios and does not work here
const SWHackyLedger = (nodeHost: string) => ({
  alias: {
    getAliasByName: async (aliasName: string) => {
      const response = await fetch(`${nodeHost}/api?requestType=getAlias&aliasName=${aliasName}`);
      const result = await response.json();
      if (result.errorCode) {
        // @ts-ignore
        throw new Error('Failed', result.error);
      }
      return result;
    }
  }
});

async function handleBeforeNavigate(details: WebNavigation.OnBeforeNavigateDetailsType) {
  if (details.frameId > 0) return;
  try {
    const foundURI = findSRC47URI(new URL(details.url));
    if (!foundURI) return;
    const { rpcBaseURL: nodeHost } = await getCurrentNetworkHost();
    // @ts-ignore
    const resolver = new URIResolver(SWHackyLedger(nodeHost));
    const resolved = await resolver.resolve(foundURI);
    if (typeof resolved !== 'string') return;
    new URL(resolved); // throws on invalid URL
    const url = sanitizeUrl(resolved);
    console.debug('SRC47 URI found and resolved to:', url);
    await browser.tabs.update({ url });
  } catch (e: any) {
    // no op
    console.debug(e.message);
  }
}

export function initSrc47Resolver() {
  browser.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
}
