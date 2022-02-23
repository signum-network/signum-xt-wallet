import React, { memo, useMemo } from 'react';

import { Transaction } from '@signumjs/core';
import { Amount, ChainTime } from '@signumjs/util';
import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import HashChip from 'app/templates/HashChip';
import { t, getDateFnsLocale } from 'lib/i18n/react';
import { parseTxStack, parseAmountDiffs } from 'lib/temple/activity';
import { useSignumAssetMetadata, useSignumExplorerBaseUrls } from 'lib/temple/front';

import MoneyDiffView from './MoneyDiffView';
import Time from './Time';
import TxStack from './TxStack';

type ActivityItemProps = {
  accountId: string;
  transaction: Transaction;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(({ accountId, transaction, className }) => {
  const { transaction: explorerBaseUrl } = useSignumExplorerBaseUrls();
  const metadata = useSignumAssetMetadata();
  const { transaction: txId, timestamp } = transaction;

  const moneyDiff = useMemo(() => parseAmountDiffs(transaction, accountId)[0], [transaction, accountId]);
  // const dateFnsLocale = useMemo( async () => {
  //   return (await getDateFnsLocale())
  // }, [getDateFnsLocale] )
  const feeAmount = useMemo(() => Amount.fromPlanck(transaction.feeNQT!).getSigna(), [transaction.feeNQT]);
  const txStack = useMemo(() => parseTxStack(transaction, accountId), [transaction, accountId]);
  const isPending = transaction.blockTimestamp === undefined;
  const transactionStatus = useMemo(() => {
    const content = isPending ? 'pending' : 'applied';
    return (
      <span className={classNames(isPending ? 'text-gray-600' : 'text-green-600', 'capitalize')}>{t(content)}</span>
    );
  }, [isPending]);

  return (
    <div className={classNames('my-3', className)}>
      <div className="w-full flex items-center">
        <HashChip hash={txId!} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={txId!} className="mr-2" />}

        <div className={classNames('flex-1', 'h-px', 'bg-gray-200')} />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col pt-2">
          <TxStack txStack={txStack} className="mb-2" />
          <div className="mb-px text-xs font-light leading-none">{transactionStatus}</div>
          <Time
            children={() => (
              <span className="text-xs font-light text-gray-500">
                {formatDistanceToNow(ChainTime.fromChainTimestamp(timestamp!).getDate(), {
                  includeSeconds: true,
                  addSuffix: true
                })}
              </span>
            )}
          />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col flex-shrink-0">
          <MoneyDiffView assetId="signa" diff={moneyDiff.diff} pending={isPending} />
          <div className="text-xs text-gray-500 justify-end">
            {feeAmount} {metadata.symbol}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ActivityItem;
