import { Account } from '@signumjs/core';
import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';
import {
  useSignum,
  useNetwork,
  Network,
  useSignumAssetMetadata,
  AssetMetadata,
  SIGNA_TOKEN_ID
} from 'lib/temple/front';

export const ZeroAccountBalances: AccountBalances = {
  availableBalance: new BigNumber(0),
  committedBalance: new BigNumber(0),
  lockedBalance: new BigNumber(0),
  totalBalance: new BigNumber(0)
};

export interface AccountBalances {
  readonly availableBalance: BigNumber;
  readonly lockedBalance: BigNumber;
  readonly committedBalance: BigNumber;
  readonly totalBalance: BigNumber;
}

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(tokenId: string, accountId: string, opts: UseBalanceOptions = {}) {
  const signum = useSignum();
  const metadata = useSignumAssetMetadata(tokenId);
  const displayed = opts.displayed ?? true;

  const { data: account } = useRetryableSWR(
    displayed ? [`balance-${accountId}`, signum] : null,
    async () => {
      try {
        return await signum.account.getAccount({ accountId, includeCommittedAmount: true });
      } catch (e: any) {
        return null; // possibly new account
      }
    },
    {
      suspense: opts.suspense ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
      refreshInterval: 30_000,
      // @ts-ignore
      initialData: opts.initial
    }
  );

  return {
    data: account ? getBalances(account, metadata) : ZeroAccountBalances
  };
}

function getBalances(account: Account, metaData: AssetMetadata): AccountBalances {
  const { decimals, id: tokenId } = metaData;
  const divider = 10 ** decimals;
  if (!tokenId || tokenId === SIGNA_TOKEN_ID) {
    const totalBalance = new BigNumber(account.balanceNQT || '0').div(divider);
    const availableBalance = new BigNumber(account.unconfirmedBalanceNQT || '0').div(divider);
    const committedBalance = new BigNumber(account.committedBalanceNQT || '0').div(divider);
    const lockedBalance = new BigNumber(totalBalance).minus(availableBalance).minus(committedBalance);
    return {
      availableBalance,
      committedBalance,
      lockedBalance,
      totalBalance
    };
  }
  const balance = account.assetBalances ? account.assetBalances.find(({ asset }) => asset === tokenId) : undefined;
  const unconfirmedBalance = account.unconfirmedAssetBalances
    ? account.unconfirmedAssetBalances.find(({ asset }) => asset === tokenId)
    : undefined;
  const totalBalance = new BigNumber(balance?.balanceQNT || '0').div(divider);
  const availableBalance = new BigNumber(unconfirmedBalance?.unconfirmedBalanceQNT || '0').div(divider);
  const committedBalance = new BigNumber('0');
  const lockedBalance = new BigNumber(totalBalance).minus(availableBalance);
  return {
    availableBalance,
    committedBalance,
    lockedBalance,
    totalBalance
  };
}

export function useBalanceSWRKey(tokenId: string, address: string) {
  const network = useNetwork();
  return getBalanceSWRKey(network, tokenId, address);
}

export function getBalanceSWRKey(network: Network, assetSlug: string, address: string) {
  return ['balance', network.networkName, assetSlug, address];
}
