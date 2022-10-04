import React from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { AssetMetadata, SIGNA_TOKEN_ID } from 'lib/temple/front';

export type AssetIconProps = {
  metadata: AssetMetadata;
  className?: string;
  size?: number;
  assetType?: string;
};

// TODO: when alias logo is in place we use those!
const AssetIcon = (props: AssetIconProps) => {
  const { className, size, metadata } = props;

  if (metadata.id !== SIGNA_TOKEN_ID) {
    return (
      <Identicon
        type="hearts"
        hash={metadata.id}
        className={className}
        style={{ borderRadius: '50%', border: '1px solid #cbd5e0' }}
        size={size}
      />
    );
  }

  return (
    <img
      key={metadata.thumbnailUri}
      src={metadata.thumbnailUri}
      alt={metadata.name}
      className={classNames('overflow-hidden', className)}
      style={{
        width: size,
        height: size
      }}
    />
  );
};

export default AssetIcon;
