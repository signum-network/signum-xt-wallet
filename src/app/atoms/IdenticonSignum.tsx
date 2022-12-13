import React, { HTMLAttributes, memo, useEffect, useState } from 'react';

import { Address } from '@signumjs/core';
import { DescriptorData } from '@signumjs/standards';
import classNames from 'clsx';
// @ts-ignore
import hashicon from 'hashicon';
import useSWR from 'swr';

import { useSignum } from 'lib/temple/front';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  address: string;
  size?: number;
};

const IdenticonSignum = memo<IdenticonProps>(({ address, size = 100, className, style = {}, ...rest }) => {
  const signum = useSignum();
  const [imageSource, setImageSource] = useState('');

  const { data: avatarImgSrc } = useSWR(
    ['resolveAvatar', address],
    async () => {
      try {
        const accountId = Address.create(address).getNumericId();
        const { description } = await signum.account.getAccount({
          accountId,
          includeCommittedAmount: false,
          includeEstimatedCommitment: false
        });
        const descriptor = DescriptorData.parse(description, false);
        if (descriptor.avatar) {
          console.log(descriptor.avatar);
          // @ts-ignore
          return 'https://ipfs.io/ipfs/' + descriptor.avatar.ipfsCid;
        }
        return '';
      } catch (e) {
        return '';
      }
    },
    {
      shouldRetryOnError: false
    }
  );

  useEffect(() => {
    try {
      const accountId = Address.create(address).getNumericId();
      setImageSource(hashicon(accountId, { size: size - 8 }).toDataURL());
    } catch (e: any) {
      console.debug(`Identicon Error: ${e.message} - account: ${address}`);
      // no-op
    }
  }, [address, signum, size]);

  useEffect(() => {
    if (avatarImgSrc) {
      setImageSource(avatarImgSrc);
    }
  }, [avatarImgSrc]);

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
      <img className="rounded" src={imageSource} alt={`account-${address}`} />
    </div>
  );
});

export default IdenticonSignum;
