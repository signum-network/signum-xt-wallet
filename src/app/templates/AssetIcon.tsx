import React, { CSSProperties } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { AssetMetadata, getAssetSymbol } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

export type AssetIconProps = {
  metadata: AssetMetadata;
  className?: string;
  style?: CSSProperties;
  size?: number;
  assetType?: string;
};

const AssetIcon = (props: AssetIconProps) => {
  const { className, style, size, metadata } = props;
  const [imageDisplayed, setImageDisplayed] = useSafeState(true);

  if (imageDisplayed) {
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
        onError={() => {
          setImageDisplayed(false);
        }}
      />
    );
  }

  return <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />;
};

export default AssetIcon;
