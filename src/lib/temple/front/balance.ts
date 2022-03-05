
import { Account } from '@signumjs/core';
import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';
import { useTezos, useSignum } from 'lib/temple/front';

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

export function useBalance(assetSlug: string, accountId: string, opts: UseBalanceOptions = {}) {
  // TODO: accept assetSlugs to get the tokens amounts also
  const signum = useSignum();
  const displayed = opts.displayed ?? true;

  return useRetryableSWR(
    displayed ? [`balance-${accountId}`, signum] : null,
    async () => {
      try {
        const account = await signum.account.getAccount({ accountId, includeCommittedAmount: true });
        // TODO: dynamic decimals
        return getBalances(account, 8);
      } catch (e) {
        return ZeroAccountBalances;
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
}

function getBalances(account: Account, decimals: number): AccountBalances {
  const divider = 10 ** decimals;
  const totalBalance = new BigNumber(account.balanceNQT || '0').div(divider);
  const availableBalance = new BigNumber(account.unconfirmedBalanceNQT || '0').div(divider);
  const committedBalance = new BigNumber(account.committedBalanceNQT || '0').div(divider);
  // other locked balances
  const lockedBalance = new BigNumber(totalBalance).minus(availableBalance).minus(committedBalance).div(divider);
  return {
    availableBalance,
    committedBalance,
    lockedBalance,
    totalBalance
  };
}

export function useBalanceSWRKey(assetSlug: string, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, assetSlug, address);
}

export function getBalanceSWRKey(tezos: any, assetSlug: string, address: string) {
  return ['balance', tezos.checksum, assetSlug, address];
}
