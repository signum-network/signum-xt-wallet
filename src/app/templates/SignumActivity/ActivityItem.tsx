import React, { memo, useMemo } from 'react';

import { Transaction } from '@signumjs/core';
import { Amount, ChainTime } from '@signumjs/util';
import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import Time from 'app/atoms/Time';
import HashChip from 'app/templates/HashChip';
import { getDateFnsLocale, t } from 'lib/i18n/react';
import { parseTransaction, parseAmountDiffs } from 'lib/temple/activity';
import {
  SIGNA_METADATA, SIGNA_TOKEN_ID,
  useSignumAccountPrefix,
  useSignumAssetMetadata,
  useSignumExplorerBaseUrls
} from 'lib/temple/front';

import MoneyDiffView from './MoneyDiffView';
import TxItem from './TxItem';

type ActivityItemProps = {
  accountId: string;
  tokenId: string;
  transaction: Transaction;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(({ accountId, transaction, tokenId, className }) => {
  const { transaction: explorerBaseUrl } = useSignumExplorerBaseUrls();
  const metadata = useSignumAssetMetadata(tokenId);
  const prefix = useSignumAccountPrefix();
  const { transaction: txId, timestamp } = transaction;

  const dateFnsLocale = getDateFnsLocale();
  const moneyDiff = useMemo(() => parseAmountDiffs(transaction, accountId, metadata), [transaction, accountId, tokenId]);
  const feeAmount = useMemo(() => Amount.fromPlanck(transaction.feeNQT).getSigna(), [transaction.feeNQT]);
  const parsedTransaction = useMemo(
    () => parseTransaction(transaction, accountId, prefix, tokenId !== SIGNA_TOKEN_ID),
    [transaction, accountId, prefix]
  );
  const isPending = transaction.blockTimestamp === undefined;
  const transactionStatus = useMemo(() => {
    const content = isPending ? 'pending' : 'applied';
    return (
      <span className={classNames(isPending ? 'text-gray-700' : 'text-green-700', 'capitalize')}>{t(content)}</span>
    );
  }, [isPending]);

  return (
    <div className={classNames('my-3', className)}>
      <div className="w-full flex items-center">
        <HashChip hash={txId} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} id={txId} className="mr-2" />}

        <div className={classNames('flex-1', 'h-px', 'bg-gray-100')} />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col pt-2">
          <TxItem item={parsedTransaction} className="mb-2" />
          <div className="mb-px text-xs font-light leading-none">{transactionStatus}</div>
          <Time
            children={() => (
              <span className="text-xs font-light text-gray-700">
                {formatDistanceToNow(ChainTime.fromChainTimestamp(timestamp).getDate(), {
                  includeSeconds: true,
                  addSuffix: true,
                  locale: dateFnsLocale
                })}
              </span>
            )}
          />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col flex-shrink-0">
          <MoneyDiffView tokenId={tokenId} diff={moneyDiff.diff} pending={isPending} />
          <div className="text-xs text-gray-700 text-right">
            {feeAmount} {SIGNA_METADATA.symbol}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ActivityItem;
