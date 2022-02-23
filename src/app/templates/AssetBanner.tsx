import React, { FC } from 'react';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';

import { getAssetName, getAssetSymbol, useSignumAssetMetadata } from '../../lib/temple/front';
import AssetIcon from './AssetIcon';
import Balance from './Balance';
import BannerLayout from './BannerLayout';
import InUSD from './InUSD';

type AssetBannerProps = {
  assetSlug: string;
  accountId: string;
};

const AssetBanner: FC<AssetBannerProps> = ({ assetSlug, accountId }) => {
  const assetMetadata = useSignumAssetMetadata(assetSlug);
  return (
    <BannerLayout name={<Name style={{ maxWidth: '18rem' }}>{getAssetName(assetMetadata)}</Name>}>
      <AssetIcon assetSlug={assetSlug} size={48} className="mr-3 flex-shrink-0" />

      <div className="font-light leading-none">
        <div className="flex items-center">
          <Balance accountId={accountId} assetSlug={assetSlug}>
            {balance => (
              <div className="flex flex-col">
                <span className="text-xl text-gray-800">
                  <Money smallFractionFont={false}>{balance}</Money>{' '}
                  <span className="text-lg">{getAssetSymbol(assetMetadata)}</span>
                </span>

                <InUSD assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                  {usdBalance => <div className="mt-1 text-sm text-gray-500">≈ {usdBalance} $</div>}
                </InUSD>
              </div>
            )}
          </Balance>
        </div>
      </div>
    </BannerLayout>
  );
};

export default AssetBanner;
