import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Address, Ledger, Transaction, TransactionType } from '@signumjs/core';

import { useRetryableSWR } from 'lib/swr';
import { useSignum } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';

export const ACTIVITY_PAGE_SIZE = 10;

interface FetchArgs {
  signum: Ledger;
  accountId: string;
  tokenId: string;
  firstIndex?: number;
  transactions?: Transaction[];
}

interface LiteTokenTransaction {
  timestamp: number;
  transactionId: string;
}

async function fetchTokenTransactionIds(args: FetchArgs): Promise<string[]> {
  const { signum, accountId, tokenId } = args;
  let transactions: LiteTokenTransaction[] = [];
  const [{ trades }, { transfers }] = await Promise.all([
    signum.asset.getAssetTrades({ accountId, assetId: tokenId }),
    signum.asset.getAssetTransfers({ accountId, assetId: tokenId })
  ]);

  transactions.push(
    ...trades.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.tradeType.toLowerCase() === 'buy' ? t.bidOrder : t.askOrder
    })),
    ...transfers.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.assetTransfer
    }))
  );

  transactions.sort((t1, t2) => t2.timestamp - t1.timestamp);

  return transactions.map(t => t.transactionId);
}

type TokenActivityProps = {
  publicKey: string;
  tokenId: string;
  className?: string;
};

const TokenActivity = memo<TokenActivityProps>(({ publicKey, className, tokenId }) => {
  const signum = useSignum();
  const hasMoreRef = useRef(false);
  const safeStateKey = useMemo(() => publicKey, [publicKey]);
  const [restTransactions, setRestTransactions] = useSafeState<Transaction[]>([], safeStateKey);
  const [loadingMore, setLoadingMore] = useSafeState(false, safeStateKey);
  const [isInitialLoading, setInitialLoading] = useSafeState(true, safeStateKey);
  const [latestTransactions, setLatestTransactions] = useSafeState<Transaction[]>([], safeStateKey);

  const accountId = useMemo(() => publicKey && Address.fromPublicKey(publicKey).getNumericId(), [publicKey]);

  const { data: transactionIds } = useRetryableSWR(
    ['getAccountTokenTransactionIds', accountId, tokenId, signum.account],
    () => {
      return fetchTokenTransactionIds({
        signum,
        accountId,
        tokenId
      });
    },
    {
      revalidateOnMount: true,
      refreshInterval: 60_000,
      dedupingInterval: 30_000
    }
  );

  const { data: unconfirmedTransactions } = useRetryableSWR(
    ['getUnconfirmedAccountTokenTransactions', accountId, signum.account],
    async () => {
      const { unconfirmedTransactions } = await signum.account.getUnconfirmedAccountTransactions(accountId, true);
      setInitialLoading(false);
      return {
        unconfirmedTransactions: unconfirmedTransactions.filter(
          t => t.type === TransactionType.Asset && t.attachment.asset === tokenId
        )
      };
    },
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 15_000
    }
  );

  useEffect(() => {
    if (!transactionIds) return;

    hasMoreRef.current = transactionIds.length >= ACTIVITY_PAGE_SIZE;

    async function fetchTransactionsByIds(ids: string[]) {
      const tokenTransactionRequests = ids
        .slice(0, ACTIVITY_PAGE_SIZE)
        .map(txId => signum.transaction.getTransaction(txId));
      const mostRecentTransactions = await Promise.all(tokenTransactionRequests);
      setLatestTransactions(mostRecentTransactions);
      setInitialLoading(false);
    }

    fetchTransactionsByIds(transactionIds);
  }, [setInitialLoading, setLatestTransactions, signum.transaction, transactionIds]);

  const transactions = useMemo(() => {
    const pendingTransactions = unconfirmedTransactions?.unconfirmedTransactions || [];
    const confirmedTransactions = mergeTransactions(latestTransactions, restTransactions);
    return [...pendingTransactions, ...confirmedTransactions];
  }, [unconfirmedTransactions, latestTransactions, restTransactions]);

  const handleLoadMore = useCallback(async () => {
    if (!transactionIds) return;
    setLoadingMore(true);
    try {
      const firstIndex = latestTransactions?.length ?? 0;
      const tokenTransactionRequests = transactionIds
        .slice(firstIndex, firstIndex + ACTIVITY_PAGE_SIZE)
        .map(txId => signum.transaction.getTransaction(txId));
      const olderTransactions = await Promise.all(tokenTransactionRequests);
      setRestTransactions(tx => [...tx, ...olderTransactions]);
      setInitialLoading(false);
      hasMoreRef.current = olderTransactions.length >= ACTIVITY_PAGE_SIZE;
    } catch (err: any) {
      console.error(err);
    }
    setLoadingMore(false);
  }, [
    transactionIds,
    setLoadingMore,
    latestTransactions?.length,
    setRestTransactions,
    setInitialLoading,
    signum.transaction
  ]);

  return (
    <ActivityView
      accountId={accountId}
      tokenId={tokenId}
      transactions={transactions}
      initialLoading={isInitialLoading}
      loadingMore={loadingMore}
      loadMoreDisplayed={hasMoreRef.current}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default TokenActivity;

// TODO: export
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
