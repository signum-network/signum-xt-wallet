import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import useSWR from 'swr';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as AddressIcon } from 'app/icons/address.svg';
import { ReactComponent as AliasIcon } from 'app/icons/alias.svg';
import HashChip from 'app/templates/HashChip';
import {
  fetchFromStorage,
  putToStorage,
  useSignum,
  useSignumAliasResolver,
  useSignumExplorerBaseUrls
} from 'lib/temple/front';

type AddressChipProps = {
  accountId: string;
  className?: string;
  small?: boolean;
};

const AddressChip: FC<AddressChipProps> = ({ accountId, className, small }) => {
  const signum = useSignum();
  const { resolveAccountIdToAlias } = useSignumAliasResolver();
  const { account: explorerBaseUrl } = useSignumExplorerBaseUrls();

  const { data: accountInfo } = useSWR(
    () => ['getAccount', accountId],
    () =>
      signum.account.getAccount({
        accountId,
        includeCommittedAmount: false,
        includeEstimatedCommitment: false
      }),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );

  const { data: aliasName } = useSWR(
    () => ['getAlias', accountId],
    () => resolveAccountIdToAlias(accountId),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );

  const [aliasDisplayed, setAliasDisplayed] = useState(false);
  const aliasDisplayedKey = useMemo(() => 'alias-displayed', []);

  useEffect(() => {
    (async () => {
      try {
        const val = await fetchFromStorage(aliasDisplayedKey);
        setAliasDisplayed(val ?? true);
      } catch {}
    })();
  }, [aliasDisplayedKey, setAliasDisplayed]);

  const handleToggleAliasClick = useCallback(() => {
    setAliasDisplayed(d => {
      const newValue = !d;
      putToStorage(aliasDisplayedKey, newValue);
      return newValue;
    });
  }, [setAliasDisplayed, aliasDisplayedKey]);

  const Icon = aliasDisplayed ? AddressIcon : AliasIcon;

  return (
    <div className={classNames('flex flex-col items-center', className)}>
      <div className="flex items-center">
        {aliasName && aliasDisplayed ? (
          <HashChip hash={aliasName} firstCharsCount={7} lastCharsCount={10} small={small} />
        ) : (
          <HashChip hash={accountId} isAccount small={small} />
        )}
        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={accountId} className="mr-2" />}
        {aliasName && (
          <button
            type="button"
            className={classNames(
              'ml-2',
              'bg-gray-100 hover:bg-gray-200',
              'rounded-sm shadow-xs',
              small ? 'text-xs' : 'text-sm',
              'text-gray-500 leading-none select-none',
              'transition ease-in-out duration-300',
              'inline-flex items-center justify-center'
            )}
            style={{
              padding: 3
            }}
            onClick={handleToggleAliasClick}
          >
            <Icon className={classNames('w-auto stroke-current', small ? 'h-3' : 'h-4')} />
          </button>
        )}
      </div>
      <div>
        {accountInfo?.name && (
          <small
            className={classNames(
              'text-xs',
              'text-gray-500 leading-none select-none',
              'transition ease-in-out duration-300'
            )}
          >
            {accountInfo.name}
          </small>
        )}
      </div>
    </div>
  );
};

export default AddressChip;
