import React, { memo } from 'react';

import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { useAppEnv } from 'app/env';
import { getAssetSymbol, useSignumAssetMetadata } from 'lib/temple/front';

type MoneyDiffViewProps = {
  tokenId: string;
  diff: string;
  pending?: boolean;
  className?: string;
};

const MoneyDiffView = memo<MoneyDiffViewProps>(({ tokenId, diff, pending = false, className }) => {
  const { fullPage, popup } = useAppEnv();
  const metadata = useSignumAssetMetadata(tokenId);
  return metadata ? (
    <div className={classNames('inline-flex flex-wrap justify-end items-baseline', className)}>
      <div
        className={classNames(
          popup ? 'text-xs' : 'text-sm',
          pending ? 'text-yellow-600' : diff.startsWith('-') ? 'text-red-700' : 'text-green-500'
        )}
      >
        <Money>{diff}</Money> {getAssetSymbol(metadata, !fullPage)}
      </div>
    </div>
  ) : null;
});

export default MoneyDiffView;
