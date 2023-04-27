import React, { memo } from 'react';

import classNames from 'clsx';

import { ReactComponent as NostrIcon } from 'app/icons/nostr-logo-no-text.svg';

type NetworkBadgeProps = {
  networkName: string;
  darkTheme?: boolean;
  large?: boolean;
};

const NetworkBadge = memo<NetworkBadgeProps>(({ networkName, darkTheme = false, large = false }) => {
  const isNostr = networkName.toLowerCase() === 'nostr';
  const textAndBorderStyle = darkTheme ? 'border-white text-white' : 'border-black text-black';
  return (
    <span
      className={classNames(
        'rounded-sm',
        'border border-opacity-25',
        'leading-tight',
        'text-opacity-50',
        textAndBorderStyle,
        'flex flex-row justify-center items-center'
      )}
      style={large ? { fontSize: '1rem', padding: '6px 0.5rem' } : { fontSize: '0.6rem', padding: '3px 0.25rem' }}
    >
      {isNostr && <NostrIcon className="h-8 w-auto mr-2" />}
      {networkName}
    </span>
  );
});

export default NetworkBadge;
