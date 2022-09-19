import React, { CSSProperties, memo, useEffect, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { getAssetSymbol, getThumbnailUri, useSignumAssetMetadata } from 'lib/temple/front';

export type AssetIconProps = {
  tokenId: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  assetType?: string;
};

const AssetIcon = (props: AssetIconProps) => {
  const { tokenId, className, style, size } = props;
  const metadata = useSignumAssetMetadata(tokenId);
  const [imageDisplayed, setImageDisplayed] = useState(true);
  const [thumbnailUri, setThumbnailUri] = useState('');

  useEffect(() => {
    if (!metadata) return;
    setThumbnailUri(getThumbnailUri(metadata));
  }, [metadata, setThumbnailUri]);

  console.log('thumbnail', thumbnailUri, tokenId);

  if (thumbnailUri && imageDisplayed) {
    return (
      <img
        src={thumbnailUri}
        alt={metadata?.name}
        className={classNames('overflow-hidden', className)}
        style={{
          width: size,
          height: size,
          ...style
        }}
        onError={e => setImageDisplayed(false)}
      />
    );
  }

  return <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />;
};

export default AssetIcon;
