import React, { memo, useCallback, useMemo, useRef } from 'react';

import { Address, Transaction } from '@signumjs/core';

import { useRetryableSWR } from 'lib/swr';
import { useSignum } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';

type ActivityProps = {
  publicKey: string;
  tokenId?: string;
  className?: string;
};

export const ACTIVITY_PAGE_SIZE = 10;

const Activity = memo<ActivityProps>(({ publicKey, className }) => {
  const signum = useSignum();
  const hasMoreRef = useRef(false);
  const safeStateKey = useMemo(() => publicKey, [publicKey]);
  const [restTransactions, setRestTransactions] = useSafeState<Transaction[]>([], safeStateKey);
  const [loadingMore, setLoadingMore] = useSafeState(false, safeStateKey);
  const [isInitialLoading, setInitialLoading] = useSafeState(true, safeStateKey);

  const accountId = useMemo(() => publicKey && Address.fromPublicKey(publicKey).getNumericId(), [publicKey]);

  const { data: latestTransactions } = useRetryableSWR(
    ['getAccountTransactions', accountId, signum.account],
    async () => {
      const transactionList = await signum.account.getAccountTransactions({
        accountId,
        firstIndex: 0,
        lastIndex: ACTIVITY_PAGE_SIZE - 1,
        includeIndirect: true,
        resolveDistributions: true
      });

      hasMoreRef.current = transactionList.transactions.length === ACTIVITY_PAGE_SIZE;
      setInitialLoading(false);
      return transactionList;
    },
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      dedupingInterval: 5_000
    }
  );

  const { data: unconfirmedTransactions } = useRetryableSWR(
    ['getUnconfirmedAccountTransactions', accountId, signum.account],
    async () => {
      const response = await signum.account.getUnconfirmedAccountTransactions(accountId, true);
      setInitialLoading(false);
      return response;
    },
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      dedupingInterval: 5_000
    }
  );

  const transactions = useMemo(() => {
    const pendingTransactions = unconfirmedTransactions?.unconfirmedTransactions || [];
    const confirmedTransactions = mergeTransactions(latestTransactions?.transactions, restTransactions);
    return [...pendingTransactions, ...confirmedTransactions];
  }, [unconfirmedTransactions, latestTransactions, restTransactions]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);

    try {
      const firstIndex = transactions?.length ?? 0;
      const { transactions: olderTransactions } = await signum.account.getAccountTransactions({
        accountId,
        firstIndex,
        lastIndex: firstIndex + (ACTIVITY_PAGE_SIZE - 1),
        includeIndirect: true,
        resolveDistributions: true
      });

      hasMoreRef.current = olderTransactions.length === ACTIVITY_PAGE_SIZE;

      setRestTransactions(tx => [...tx, ...olderTransactions]);
    } catch (err: any) {
      console.error(err);
    }

    setLoadingMore(false);
  }, [setLoadingMore, setRestTransactions, accountId, transactions, signum.account]);

  return (
    <ActivityView
      accountId={accountId}
      transactions={transactions}
      initialLoading={isInitialLoading}
      loadingMore={loadingMore}
      loadMoreDisplayed={hasMoreRef.current}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default Activity;

function mergeTransactions(base?: Transaction[], toAppend: Transaction[] = []) {
  if (!base) return [];

  const uniqueHashes = new Set<string>();
  const uniques: Transaction[] = [];
  for (const tx of [...base, ...toAppend]) {
    if (!uniqueHashes.has(tx.fullHash!)) {
      uniqueHashes.add(tx.fullHash!);
      uniques.push(tx);
    }
  }
  return uniques;
}
