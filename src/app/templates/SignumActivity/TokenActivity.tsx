import React, { memo, useCallback, useMemo, useRef } from 'react';

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

const SCAN_PAGE_SIZE = 100;

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
      transactionId: t.askOrderHeight < t.height ? t.bidOrder : t.askOrder
    })),
    ...transfers.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.assetTransfer
    }))
  );

  transactions.sort((t1, t2) => t2.timestamp - t1.timestamp);

  return transactions.map(t => t.transactionId);
}

async function fetchAllTokenTransactionsPerAccount(args: FetchArgs): Promise<Transaction[]> {
  const { signum, accountId, tokenId, firstIndex = 0, transactions = [] } = args;

  const allTokenTransactionList = await signum.account.getAccountTransactions({
    accountId,
    firstIndex,
    lastIndex: firstIndex + SCAN_PAGE_SIZE - 1,
    type: TransactionType.Asset
  });

  transactions.push(...allTokenTransactionList.transactions.filter(({ attachment }) => attachment.asset === tokenId));

  if (transactions.length > 0 && transactions.length < ACTIVITY_PAGE_SIZE) {
    return fetchAllTokenTransactionsPerAccount({
      signum,
      accountId,
      tokenId,
      firstIndex: firstIndex + SCAN_PAGE_SIZE,
      transactions
    });
  }

  return transactions;
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

  const accountId = useMemo(() => publicKey && Address.fromPublicKey(publicKey).getNumericId(), [publicKey]);

  const { data: latestTokenTransactions } = useRetryableSWR(
    ['getAccountTokenTransactions', accountId, tokenId, signum.account],
    async () => {
      const args = {
        signum,
        accountId,
        tokenId
      };
      const tokenTransactionIds = await fetchTokenTransactionIds(args);
      const tokenTransactionRequests = tokenTransactionIds
        .slice(0, ACTIVITY_PAGE_SIZE)
        .map(txId => signum.transaction.getTransaction(txId));
      const transactions = await Promise.all(tokenTransactionRequests);
      hasMoreRef.current = transactions.length === ACTIVITY_PAGE_SIZE;
      setInitialLoading(false);
      return {
        transactions
      };
    },
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      dedupingInterval: 5_000
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
      refreshInterval: 30_000,
      dedupingInterval: 5_000
    }
  );

  const transactions = useMemo(() => {
    const pendingTransactions = unconfirmedTransactions?.unconfirmedTransactions || [];
    const confirmedTransactions = mergeTransactions(latestTokenTransactions?.transactions, restTransactions);
    return [...pendingTransactions, ...confirmedTransactions];
  }, [unconfirmedTransactions, latestTokenTransactions, restTransactions]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const firstIndex = transactions?.length ?? 0;
      const olderTokenTransactions = await fetchAllTokenTransactionsPerAccount({
        signum,
        accountId,
        tokenId,
        firstIndex
      });
      hasMoreRef.current = olderTokenTransactions.length === ACTIVITY_PAGE_SIZE;
      setRestTransactions(tx => [...tx, ...olderTokenTransactions]);
    } catch (err: any) {
      console.error(err);
    }

    setLoadingMore(false);
  }, [setLoadingMore, transactions?.length, signum, accountId, tokenId, setRestTransactions]);

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
