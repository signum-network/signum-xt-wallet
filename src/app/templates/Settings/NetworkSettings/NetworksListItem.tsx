import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import useSWR from 'swr';

import Name from 'app/atoms/Name';
import NetworkBadge from 'app/atoms/NetworkBadge';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { t, T } from 'lib/i18n/react';
import { Network } from 'lib/messaging';
import { canConnectToNetwork } from 'lib/temple/front';

type NetworksListItemProps = {
  canRemove: boolean;
  network: Network;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

export const NetworksListItem: FC<NetworksListItemProps> = props => {
  const {
    network: { name, nameI18nKey, rpcBaseURL, color, networkName },
    canRemove,
    onRemoveClick,
    last
  } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick?.(rpcBaseURL), [onRemoveClick, rpcBaseURL]);

  const { data: isReachable, isValidating } = useSWR([rpcBaseURL, 5_000, 'canConnectToNetwork'], canConnectToNetwork, {
    refreshInterval: 60_000,
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  return (
    <div
      className={classNames(
        'block w-full',
        'overflow-hidden',
        !last && 'border-b border-gray-200',
        'flex items-stretch',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none',
        isValidating && 'animate-pulse',
        !isValidating && !isReachable && 'opacity-25 bg-red-300'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
    >
      <div
        className={classNames('mt-1 ml-2 mr-3', 'w-3 h-3', 'border border-primary-white', 'rounded-full shadow-xs')}
        style={{ background: color }}
      />

      <div className="flex flex-col justify-between flex-1">
        <div className="flex flex-row justify-between">
          <Name className="mb-1 text-sm font-medium leading-tight">
            {(nameI18nKey && <T id={nameI18nKey} />) || name}
          </Name>
          <NetworkBadge networkName={networkName} />
        </div>

        <div
          className={classNames('text-xs text-gray-700 font-light', 'flex items-center')}
          style={{
            marginBottom: '0.125rem'
          }}
        >
          URL:<Name className="ml-1 font-normal">{rpcBaseURL}</Name>
        </div>
      </div>

      {canRemove && (
        <button
          className={classNames(
            'flex-none p-2',
            'text-gray-500 hover:text-gray-600',
            'transition ease-in-out duration-200'
          )}
          onClick={handleRemoveClick}
        >
          <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
        </button>
      )}
    </div>
  );
};
