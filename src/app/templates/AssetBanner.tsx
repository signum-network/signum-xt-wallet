import React, { memo } from 'react';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { T } from 'lib/i18n/react';

import {
  getAssetName,
  getAssetSymbol,
  SIGNA_TOKEN_ID,
  useBalance,
  useSignumAssetMetadata
} from '../../lib/temple/front';
import AssetIcon from './AssetIcon';
import Balance from './Balance';
import BannerLayout from './BannerLayout';

type AssetBannerProps = {
  tokenId: string;
  accountId: string;
};

const AssetBanner = memo<AssetBannerProps>(({ tokenId, accountId }) => {
  const assetMetadata = useSignumAssetMetadata(tokenId);
  const signaMetadata = useSignumAssetMetadata(SIGNA_TOKEN_ID);
  const signaBalance = useBalance(SIGNA_TOKEN_ID, accountId);

  return (
    <BannerLayout name={<Name style={{ maxWidth: '18rem' }}>{getAssetName(assetMetadata)}</Name>}>
      <AssetIcon metadata={assetMetadata} size={48} className="mr-3 flex-shrink-0" />

      <div className="font-light leading-none">
        <div className="flex items-center">
          <Balance accountId={accountId} tokenId={tokenId}>
            {(totalBalance, balances) => (
              <div className="my-1 relative flex flex-col">
                <span className="text-xl text-gray-800">
                  <Money smallFractionFont={false}>{totalBalance}</Money>{' '}
                  <span className="text-lg">{getAssetSymbol(assetMetadata)}</span>
                </span>
                {tokenId !== SIGNA_TOKEN_ID && (
                  <span className="mt-2 text-xs text-gray-600">
                    <T id="availableBalance">{msg => <span className="text-xs text-gray-600">{msg}</span>}</T>
                    {': '}
                    <Money smallFractionFont={false}>{signaBalance.data.availableBalance}</Money>{' '}
                    <span className="text-xs text-gray-600">{getAssetSymbol(signaMetadata)}</span>
                  </span>
                )}
                {!balances.availableBalance.eq(balances.totalBalance) && (
                  <>
                    <span className="mt-2 text-xs text-gray-600">
                      <T id="availableBalance">{msg => <span className="text-xs text-gray-600">{msg}</span>}</T>
                      {': '}
                      <Money smallFractionFont={false}>{balances.availableBalance}</Money>{' '}
                      <span className="text-xs text-gray-600">{getAssetSymbol(assetMetadata)}</span>
                    </span>
                    {balances.committedBalance.gt(0) && (
                      <span className="mt-1 text-xs text-gray-600">
                        <T id="committedBalance">{msg => <span className="text-xs text-gray-600">{msg}</span>}</T>
                        {': '}
                        <Money smallFractionFont={false}>{balances.committedBalance}</Money>{' '}
                        <span className="text-xs text-gray-600">{getAssetSymbol(assetMetadata)}</span>
                      </span>
                    )}
                    {balances.lockedBalance.gt(0) && (
                      <span className="mt-1 text-xs text-gray-600">
                        <T id="lockedBalance">{msg => <span className="text-xs text-gray-600">{msg}</span>}</T>
                        {': '}
                        <Money smallFractionFont={false}>{balances.lockedBalance}</Money>{' '}
                        <span className="text-xs text-gray-600">{getAssetSymbol(assetMetadata)}</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </Balance>
        </div>
      </div>
    </BannerLayout>
  );
});

export default AssetBanner;
