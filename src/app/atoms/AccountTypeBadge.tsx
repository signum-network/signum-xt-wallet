import React, { memo } from 'react';

import classNames from 'clsx';

import { t } from 'lib/i18n/react';
import { XTAccount, XTAccountType } from 'lib/temple/front';

type AccountTypeBadgeProps = {
  account: Pick<XTAccount, 'type'>;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ account, darkTheme = false }) => {
  const title = account.type === XTAccountType.WatchOnly ? t('watchOnlyAccount') : t('ownAccount');

  const textAndBorderStyle = darkTheme ? 'border-white text-white' : 'border-black text-black';

  return (
    <span
      className={classNames(
        'ml-2',
        'rounded-sm',
        'border border-opacity-25',
        'px-1 py-px',
        'leading-tight',
        'text-opacity-50',
        textAndBorderStyle
      )}
      style={{ fontSize: '0.6rem' }}
    >
      {title}
    </span>
  );
});

export default AccountTypeBadge;
