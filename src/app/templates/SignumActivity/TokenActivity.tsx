import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Address, Ledger, Transaction, TransactionAssetSubtype, TransactionType } from '@signumjs/core';

import { useRetryableSWR } from 'lib/swr';
import { mergeTransactions } from 'lib/temple/activity/mergeTransactions';
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
  // We do different requests here to be as accurate as possible
  // Note: using only getAccountTransactions would reveal only the last 500 transactions of the account
  // a quite active account can easily do hundreds of tx per day, and then no
  const [{ trades }, { transfers }, { transactions: tokenTransactions }, { askOrders }, { bidOrders }] =
    await Promise.all([
      signum.asset.getAssetTrades({ accountId, assetId: tokenId }),
      signum.asset.getAssetTransfers({ accountId, assetId: tokenId }),
      signum.account.getAccountTransactions({
        accountId,
        type: TransactionType.Asset,
        includeIndirect: true
      }),
      signum.asset.getOpenAskOrdersPerAccount({ accountId, assetId: tokenId }),
      signum.asset.getOpenBidOrdersPerAccount({ accountId, assetId: tokenId })
    ]);

  const tokenOperations = tokenTransactions.filter(
    tx =>
      tx.attachment &&
      (tx.attachment.assetToDistribute === tokenId || tx.attachment.asset === tokenId || tx.transaction === tokenId) // token issuance - manually - does not cover SC issuances
  );
  // // TODO: this is just a work around.... once the orders come with timestamp we can get rid of next lines
  const orderTxRequests = askOrders.concat(...bidOrders).map(({ order }) => signum.transaction.getTransaction(order));
  const orders = await Promise.all(orderTxRequests);

  transactions.push(
    ...trades.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.tradeType.toLowerCase() === 'buy' ? t.bidOrder : t.askOrder
    })),
    ...transfers.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.assetTransfer
    })),
    ...tokenOperations.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.transaction
    })),
    ...orders.map(t => ({
      timestamp: t.timestamp,
      transactionId: t.transaction
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
  const fetchedTxCountRef = useRef(0);
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

  const fetchTransactionsByIds = useCallback(
    async (ids: string[]) => {
      const tokenTransactionRequests = ids.map(txId => signum.transaction.getTransaction(txId));
      const transactions = await Promise.all(tokenTransactionRequests);
      const requests = transactions
        .filter(
          t =>
            t.type === TransactionType.Asset &&
            t.subtype === TransactionAssetSubtype.AssetDistributeToHolders &&
            t.sender !== accountId
        )
        .map(tx => signum.transaction.getDistributionAmountsFromTransaction(tx.transaction, accountId));
      const distributions = await Promise.all(requests);

      for (let tx of transactions) {
        const foundDx = distributions.find(dx => dx.transaction === tx.transaction);
        if (foundDx) {
          tx.distribution = {
            ...foundDx,
            assetId: tokenId,
            distributedAssetId: tokenId // is the same here
          };
        }
      }
      return transactions;
    },
    [accountId, signum.transaction, tokenId]
  );

  useEffect(() => {
    if (!transactionIds) return;
    hasMoreRef.current = transactionIds.length >= ACTIVITY_PAGE_SIZE;
    fetchTransactionsByIds(transactionIds.slice(0, ACTIVITY_PAGE_SIZE)).then(resolvedTransactions => {
      fetchedTxCountRef.current += ACTIVITY_PAGE_SIZE;
      setLatestTransactions(resolvedTransactions);
      setInitialLoading(false);
    });
  }, [fetchTransactionsByIds, setInitialLoading, setLatestTransactions, transactionIds]);

  const transactions = useMemo(() => {
    const pendingTransactions = unconfirmedTransactions?.unconfirmedTransactions || [];
    const confirmedTransactions = mergeTransactions(latestTransactions, restTransactions);
    return [...pendingTransactions, ...confirmedTransactions];
  }, [unconfirmedTransactions, latestTransactions, restTransactions]);

  const handleLoadMore = useCallback(async () => {
    if (!transactionIds) return;
    setLoadingMore(true);
    try {
      const firstIndex = fetchedTxCountRef.current;
      const nextTransactionIds = transactionIds.slice(firstIndex, firstIndex + ACTIVITY_PAGE_SIZE);
      const olderTransactions = await fetchTransactionsByIds(nextTransactionIds);
      fetchedTxCountRef.current += ACTIVITY_PAGE_SIZE;
      setRestTransactions(tx => [...tx, ...olderTransactions]);
      setInitialLoading(false);
      hasMoreRef.current = transactionIds.length > fetchedTxCountRef.current;
    } catch (err: any) {
      console.error(err);
    }
    setLoadingMore(false);
  }, [
    transactionIds,
    setLoadingMore,
    latestTransactions?.length,
    fetchTransactionsByIds,
    setRestTransactions,
    setInitialLoading
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
