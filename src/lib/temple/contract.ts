import { TezosToolkit, WalletContract } from '@taquito/taquito';
import memoize from 'micro-memoize';

import { TempleChainId } from 'lib/messaging';

const KNOWN_CHAIN_IDS = Object.values(TempleChainId) as string[];

export const loadContract = memoize(fetchContract, {
  isPromise: true,
  maxSize: 100
});

export function fetchContract(tezos: TezosToolkit, address: string, walletAPI = true): Promise<WalletContract> {
  return walletAPI ? tezos.wallet.at(address) : (tezos.contract.at(address) as any);
}

export async function loadContractForCallLambdaView(tezos: TezosToolkit, contractAddress: string) {
  const chainId = await tezos.rpc.getChainId();
  if (KNOWN_CHAIN_IDS.includes(chainId)) {
    // tezos = new TezosToolkit(tezos.rpc);
    // tezos.setSignerProvider(lambdaSigner);
    // tezos.setPackerProvider(michelEncoder);
  }

  const contract: any = await loadContract(tezos, contractAddress, false);
  return contract;
}
