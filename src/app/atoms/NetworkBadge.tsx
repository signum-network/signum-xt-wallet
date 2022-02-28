import React, { memo } from 'react';

import classNames from 'clsx';

type NetworkBadgeProps = {
  networkName: string;
  darkTheme?: boolean;
};

const NetworkBadge = memo<NetworkBadgeProps>(({ networkName, darkTheme = false }) => {
  const textAndBorderStyle = darkTheme ? 'border-white text-white' : 'border-black text-black';
  return (
    <span
      className={classNames(
        'ml-2',
        'rounded-sm',
        'border border-opacity-25',
        'leading-tight',
        'text-opacity-50',
        textAndBorderStyle
      )}
      style={{ fontSize: '0.6rem', padding: '3px 0.25rem' }}
    >
      {networkName}
    </span>
  );
});

export default NetworkBadge;
