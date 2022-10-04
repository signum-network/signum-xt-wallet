import React, { CSSProperties } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { AssetMetadata, getAssetSymbol, SIGNA_TOKEN_ID } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

export type AssetIconProps = {
  metadata: AssetMetadata;
  className?: string;
  style?: CSSProperties;
  size?: number;
  assetType?: string;
};

// TODO: when alias logo is in place we use those!
const AssetIcon = (props: AssetIconProps) => {
  const { className, style, size, metadata } = props;

  if (metadata.id !== SIGNA_TOKEN_ID) {
    return (
      <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />
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
        height: size,
        ...style
      }}
    />
  );
};

export default AssetIcon;
