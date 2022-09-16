import React, { memo } from 'react';

import { Transaction } from '@signumjs/core';
import classNames from 'clsx';

import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import Spinner from 'app/atoms/Spinner';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { T } from 'lib/i18n/react';

import ActivityItem from './ActivityItem';

type ActivityViewProps = {
  accountId: string;
  tokenId: string;
  transactions: Transaction[];
  initialLoading: boolean;
  loadingMore: boolean;
  loadMoreDisplayed: boolean;
  loadMore: () => void;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(
  ({
       accountId,
       transactions,
       initialLoading, loadingMore, loadMoreDisplayed, loadMore, className , tokenId}) => {
    const noTransactions = transactions.length === 0;

    if (initialLoading) {
      return <ActivitySpinner />;
    }

    if (noTransactions) {
      return (
        <div className={classNames('mt-4 mb-12', 'flex flex-col items-center justify-center', 'text-gray-500')}>
          <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

          <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
            <T id="noOperationsFound" />
          </h3>
        </div>
      );
    }

    return (
      <>
        <div className={classNames('w-full max-w-md mx-auto', 'flex flex-col', className)}>
          {transactions?.map((tx, id) => (
            <ActivityItem
              key={`${tx.transaction}-${id}}`}
              accountId={accountId}
              transaction={tx}
              className={className}
              tokenId={tokenId}
            />
          ))}
        </div>

        {loadingMore ? (
          <ActivitySpinner />
        ) : (
          <div className="w-full flex justify-center mt-5 mb-3">
            {loadMoreDisplayed && (
              <FormSecondaryButton onClick={loadMore} small>
                <T id="loadMore" />
              </FormSecondaryButton>
            )}
          </div>
        )}
      </>
    );
  }
);

const ActivitySpinner = memo(() => (
  <div className="w-full flex items-center justify-center mt-5 mb-3" style={{ height: '2.5rem' }}>
    <Spinner theme="gray" className="w-16" />
  </div>
));

export default ActivityView;
