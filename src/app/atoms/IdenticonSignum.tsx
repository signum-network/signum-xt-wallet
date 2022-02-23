import React, { FC, HTMLAttributes, useMemo } from 'react';

import classNames from 'clsx';
// @ts-ignore
import hashicon from 'hashicon';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  accountId: string;
  size?: number;
};

const IdenticonSignum: FC<IdenticonProps> = ({ accountId, size = 100, className, style = {}, ...rest }) => {
  const iconSrc = useMemo(() => {
    if (!accountId) return '';
    return hashicon(accountId, { size: size - 8 }).toDataURL();
  }, [accountId, size]);

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
      <img src={iconSrc} alt={`account-${accountId}`} />
    </div>
  );
};

export default IdenticonSignum;
