import React, { FC, HTMLAttributes, useMemo } from 'react';

import { Address } from '@signumjs/core';
import classNames from 'clsx';
// @ts-ignore
import hashicon from 'hashicon';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  address: string;
  size?: number;
};

const IdenticonSignum: FC<IdenticonProps> = ({ address, size = 100, className, style = {}, ...rest }) => {
  const iconSrc = useMemo(() => {
    if (!address) return '';
    const accountId = Address.create(address).getNumericId();
    return hashicon(accountId, { size: size - 8 }).toDataURL();
  }, [address, size]);

  return (
    <div
      className={classNames('inline-block bg-gray-100 bg-no-repeat bg-center overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        padding: '4px',
        borderRadius: Math.round(size / 10),
        ...style
      }}
      {...rest}
    >
      <img src={iconSrc} alt={`account-${address}`} />
    </div>
  );
};

export default IdenticonSignum;
