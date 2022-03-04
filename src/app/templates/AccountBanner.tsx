import React, { HTMLAttributes, memo, ReactNode } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Balance from 'app/templates/Balance';
import { t } from 'lib/i18n/react';
import { useSignumAssetMetadata, XTAccount } from 'lib/temple/front';

import HashShortView from '../atoms/HashShortView';
import IdenticonSignum from '../atoms/IdenticonSignum';

type AccountBannerProps = HTMLAttributes<HTMLDivElement> & {
  account: XTAccount;
  displayBalance?: boolean;
  networkRpc?: string;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelIndent?: 'sm' | 'md';
};

const AccountBanner = memo<AccountBannerProps>(
  ({ account, displayBalance = true, networkRpc, className, label, labelIndent = 'md', labelDescription }) => {
    const { symbol } = useSignumAssetMetadata();
    const labelWithFallback = label ?? t('account');

    return (
      <div className={classNames('flex flex-col', className)}>
        {(labelWithFallback || labelDescription) && (
          <h2 className={classNames(labelIndent === 'md' ? 'mb-4' : 'mb-2', 'leading-tight', 'flex flex-col')}>
            {labelWithFallback && <span className="text-base font-semibold text-gray-700">{labelWithFallback}</span>}

            {labelDescription && (
              <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
                {labelDescription}
              </span>
            )}
          </h2>
        )}

        <div className={classNames('w-full', 'border rounded-md', 'p-2', 'flex items-center')}>
          <IdenticonSignum accountId={account.publicKeyHash} size={32} className="flex-shrink-0 shadow-xs" />

          <div className="flex flex-col items-start ml-2">
            <div className="flex flex-wrap items-center">
              <Name className="text-sm font-medium leading-tight text-gray-800">{account.name}</Name>

              <AccountTypeBadge account={account} />
            </div>

            <div className="flex flex-wrap items-center mt-1">
              <div className={classNames('text-xs leading-none', 'text-gray-700')}>
                <HashShortView hash={account.publicKeyHash} isAccount />
              </div>

              {displayBalance && (
                <Balance accountId={account.publicKeyHash} networkRpc={networkRpc}>
                  {bal => (
                    <div className={classNames('ml-2', 'text-xs leading-none', 'text-gray-700')}>
                      <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{symbol}</span>
                    </div>
                  )}
                </Balance>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AccountBanner;
