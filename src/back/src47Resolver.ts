import { sanitizeUrl } from '@braintree/sanitize-url';
import { URIResolver } from '@signumjs/standards';
import browser, { WebNavigation } from 'webextension-polyfill';

import { getCurrentNetworkHost } from './dapp';

const stripTrailingSlash = (url: string) => {
  return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
};
function extractSRC47URI(url: URL): string {
  const parse = (str: string) => {
    try {
      if (!str.startsWith('https://') && !str.startsWith('http://')) {
        str = `https://${str}`;
      }
      URIResolver.parseURI(str);
      return str;
    } catch (e: any) {
      /// ignore - not valid uri
      return '';
    }
  };

  let uri = parse(url.href);
  if (!uri) {
    // check search string
    const search = url.searchParams;
    for (let [, value] of search) {
      uri = parse(value);
      if (uri) {
        break;
      }
    }
  }
  return uri;
}

// Service Workers can only use fetch api.... SignumJS legder uses Axios and does not work here
const SWHackyLedger = (nodeHost: string) => ({
  alias: {
    getAliasByName: async (aliasName: string, tld?: string) => {
      let url = `${nodeHost}/api?requestType=getAlias&aliasName=${aliasName}`;
      if (tld) {
        url += `&tld=${tld}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.errorCode) {
        // @ts-ignore
        throw new Error('Failed', result.error);
      }
      return result;
    }
  }
});

let lastResolved = '';
async function handleBeforeNavigate(details: WebNavigation.OnBeforeNavigateDetailsType) {
  // Handles SRC47 Links: https://github.com/signum-network/SIPs/blob/master/SIP/sip-47.md
  // url in format: https://<subdomain>.<domain>@<namespace>
  // url in format: https://<subdomain>.<domain>.<namespace>
  if (details.frameId > 0) return;
  try {
    const link = stripTrailingSlash(details.url);
    console.debug('[Signum SRC47 Resolver] - incoming link: ', link);
    if (link === lastResolved) {
      console.debug('[Signum SRC47 Resolver] - already resolved - skipping', lastResolved);
      return;
    }
    lastResolved = '';
    const uri = extractSRC47URI(new URL(link));

    if (!uri) {
      console.debug('[Signum SRC47 Resolver] - Not a Signum URI', link);
      return;
    }
    console.debug('[Signum SRC47 Resolver] - found Signum URI', uri);
    const { rpcBaseURL: nodeHost } = await getCurrentNetworkHost();
    // @ts-ignore
    const resolver = new URIResolver(SWHackyLedger(nodeHost));
    console.debug('[Signum SRC47 Resolver] - resolving', uri, 'using', nodeHost);
    const resolved = await resolver.resolve(uri);
    if (typeof resolved !== 'string') return;
    new URL(resolved); // throws on invalid URL
    const url = sanitizeUrl(resolved);
    console.debug('[Signum SRC47 Resolver] - resolved to', url);
    lastResolved = url;
    await browser.tabs.update({ url });
  } catch (e: any) {
    // no op
    console.debug('[Signum SRC47 Resolver] - error', e.message);
  }
}

export function initSrc47Resolver() {
  browser.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
}
