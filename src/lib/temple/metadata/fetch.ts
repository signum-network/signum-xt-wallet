import { Ledger } from '@signumjs/core';
import browser from 'webextension-polyfill';

import { AssetMetadata } from './types';

export async function fetchTokenMetadata(signum: Ledger, tokenId: string): Promise<{ base: AssetMetadata }> {
  try {
    const token = await signum.asset.getAsset({ assetId: tokenId });
    return {
      base: {
        symbol: token.name,
        decimals: token.decimals,
        name: token.name,
        id: token.asset,
        thumbnailUri: browser.runtime.getURL(`misc/token-logos/${token.name.toLowerCase()}.svg`) || undefined
      }
    };
  } catch (e: any) {
    throw new NotFoundTokenMetadata();
  }
}

export class NotFoundTokenMetadata extends Error {
  name = 'NotFoundTokenMetadata';
  message = "Metadata for token doesn't found";
}
