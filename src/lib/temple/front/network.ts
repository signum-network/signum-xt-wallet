import { AddressPrefix } from '@signumjs/core';

import { useNetwork } from './ready';

export function useSignumAccountPrefix() {
  const network = useNetwork();
  return (network.type === 'test' ? AddressPrefix.TestNet : AddressPrefix.MainNet).toString();
}

export async function canConnectToNetwork(nodeUrl: string, timeout = 5000) {
  try {
    await Promise.race([
      fetch(`${nodeUrl}/api?requestType=getBlockchainStatus`),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeout)
      )
    ]);
    console.log('all fine');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
