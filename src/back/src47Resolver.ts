import { sanitizeUrl } from '@braintree/sanitize-url';
import { URIResolver } from '@signumjs/standards';
import browser, { WebNavigation } from 'webextension-polyfill';

import { getCurrentNetworkHost } from './dapp';

function extractSRC47URI(url: URL): string {
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

  if (url.origin === 'https://signum' || url.origin === 'http://signum') {
    const alias = url.username;
    const tld = url.password || 'signum';
    return parse(`signum://${alias}:${tld}`);
  }

  const uri = parse(url.origin);
  if (!uri) {
    const search = url.searchParams;
    for (let [, value] of search) {
      console.log('resolver', value);
      if (value.endsWith('@signum')) {
        return parse(`signum://${value.replace('@signum', '')}`);
      }
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
    // url in format: https://<alias>:<namespace>@signum
    const uri = extractSRC47URI(new URL(details.url));
    if (!uri) return;
    const { rpcBaseURL: nodeHost } = await getCurrentNetworkHost();
    // @ts-ignore
    const resolver = new URIResolver(SWHackyLedger(nodeHost));
    const resolved = await resolver.resolve(uri);
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
