import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import Name from 'app/atoms/Name';
import NetworkBadge from 'app/atoms/NetworkBadge';
import { T } from 'lib/i18n/react';
import { useAllNetworks, useNetwork } from 'lib/temple/front';

type NetworkBannerProps = {
  networkName: string;
  narrow?: boolean;
};

const NetworkBanner: FC<NetworkBannerProps> = ({ networkName, narrow = false }) => {
  const allNetworks = useAllNetworks();
  const networkIsKnown = useMemo(() => allNetworks.some(n => n.networkName === networkName), [allNetworks]);

  return (
    <div className={classNames('w-full', narrow ? '-mt-1 mb-2' : 'mb-4', 'flex flex-col')}>
      <h2 className={classNames('leading-tight', 'flex flex-col')}>
        <T id="network">
          {message => (
            <span className={classNames(narrow ? 'mb-1' : 'mb-2', 'text-base font-semibold text-gray-700')}>
              {message}
            </span>
          )}
        </T>

        <div className={classNames('mb-1', 'flex flex-col')}>
          <div className={'mt-1 flex flex-row items-center justify-center'}>
            <div className="mr-1">
              <NetworkBadge networkName={networkName} large />
            </div>
          </div>
          {!networkIsKnown && (
            <div className="mt-4 mb-1">
              <T id="unknownNetwork" substitutions={[networkName]}>
                {message => (
                  <span className={classNames('flex-shrink-0 mr-2', 'text-xs font-medium text-red-500')}>
                    {message}
                  </span>
                )}
              </T>
            </div>
          )}
        </div>
      </h2>
    </div>
  );
};

export default NetworkBanner;
