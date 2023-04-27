import React, { useEffect, useState } from 'react';

import { Button } from 'app/atoms/Button';
import CopyButton from 'app/atoms/CopyButton';
import HashShortView from 'app/atoms/HashShortView';
import { ReactComponent as NostrIcon } from 'app/icons/nostr-logo-no-text.svg';
import { t } from 'lib/i18n/react';
import { XTAccount } from 'lib/messaging';
import { encodePubKey } from 'lib/nostr';
import useTippy from 'lib/ui/useTippy';
import { navigate } from 'lib/woozie';

type AddressChipProps = {
  account: XTAccount;
  className?: string;
  clickable?: boolean;
};
export const NostrAddressChip = ({ account, className, clickable = true }: AddressChipProps) => {
  const [pubKey, setPubKey] = useState('');
  const buttonRef = useTippy<HTMLButtonElement>({
    delay: 500,
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('viewNostrAccount'),
    animation: 'shift-away-subtle'
  });

  useEffect(() => {
    if (account.publicKeyNostr) {
      encodePubKey(account.publicKeyNostr).then(setPubKey);
    }
  }, [account.publicKeyNostr]);

  if (!account.publicKeyNostr || !pubKey) return null;
  const handleNostrClick = () => {
    console.log('Nostr click');
    navigate({
      pathname: `/settings/nostr-account`
    });
  };

  return (
    <div className={`flex flex-row justify-between items-center bg-purple-200 rounded py-1 px-4 ${className}`}>
      <CopyButton text={account.publicKeyNostr} className="bg-purple-200">
        <HashShortView hash={pubKey} firstCharsCount={8} lastCharsCount={8} delimiter=":" />
      </CopyButton>
      {clickable && (
        <Button
          ref={buttonRef}
          onClick={handleNostrClick}
          className="hover:bg-purple-300 transition ease-in-out duration-300"
        >
          <NostrIcon className="h-8 w-auto p-1" />
        </Button>
      )}
    </div>
  );
};
