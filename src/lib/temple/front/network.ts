import { AddressPrefix, LedgerClientFactory } from '@signumjs/core';

import { useNetwork } from './ready';

export function useSignumAccountPrefix() {
  const network = useNetwork();
  return (network.type === 'test' ? AddressPrefix.TestNet : AddressPrefix.MainNet).toString();
}

export async function canConnectToNetwork(rpcUrl: string, type: 'main' | 'test'): Promise<boolean> {
  try {
    const ledger = LedgerClientFactory.createClient({ nodeHost: rpcUrl });
    await ledger.network.getBlockchainStatus();
    return true;
  } catch (e) {
    return false;
  }
}
