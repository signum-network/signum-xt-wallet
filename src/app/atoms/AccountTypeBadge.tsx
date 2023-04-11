import React, { memo } from 'react';

import classNames from 'clsx';

import { t } from 'lib/i18n/react';
import { XTAccount, XTAccountType } from 'lib/temple/front';

type AccountTypeBadgeProps = {
  account: XTAccount;
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ account, darkTheme = false }) => {
  const title = account.type === XTAccountType.WatchOnly ? t('watchOnlyAccount') : t('ownAccount');
  const isNostr = Boolean(account.publicKeyNostr);
  const textAndBorderStyle = darkTheme ? 'border-white text-white' : 'border-black text-black';

  return (
    <span className="flex-row flex items-center">
      <span
        style={{ fontSize: '0.6rem' }}
        className={classNames(
          'ml-2',
          'rounded-sm',
          'border border-opacity-25',
          'px-1 py-px',
          'leading-tight',
          'text-opacity-50',
          textAndBorderStyle
        )}
      >
        {title}
      </span>
      {isNostr && (
        <span
          style={{ fontSize: '0.6rem' }}
          className={classNames(
            'ml-2',
            'rounded-sm',
            'border border-opacity-25',
            'px-1 py-px',
            'leading-tight',
            'text-opacity-50',
            textAndBorderStyle
          )}
        >
          Nostr
        </span>
      )}
    </span>
  );
});

export default AccountTypeBadge;
