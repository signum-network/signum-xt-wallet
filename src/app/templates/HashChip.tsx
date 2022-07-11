import React, { ComponentProps, FC, HTMLAttributes, useMemo } from 'react';

import { Address } from '@signumjs/core';

import CopyButton, { CopyButtonProps } from 'app/atoms/CopyButton';
import HashShortView from 'app/atoms/HashShortView';
import { useSignumAccountPrefix } from 'lib/temple/front';

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<CopyButtonProps, 'small' | 'type' | 'bgShade' | 'rounded' | 'textShade'>;

const HashChip: FC<HashChipProps> = ({
  hash,
  trim,
  isAccount,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = 'button',
  ...rest
}) => {
  const prefix = useSignumAccountPrefix();

  const address = useMemo(() => {
    if (!isAccount) return hash;
    try {
      return Address.create(hash, prefix).getReedSolomonAddress();
    } catch (e: any) {
      console.error('address creation failed', hash);
      return hash;
    }
  }, [hash, isAccount, prefix]);
  return (
    <CopyButton text={address} type={type} {...rest}>
      <HashShortView
        hash={hash}
        isAccount={isAccount}
        trimAfter={trimAfter}
        firstCharsCount={firstCharsCount}
        lastCharsCount={lastCharsCount}
      />
    </CopyButton>
  );
};

export default HashChip;
