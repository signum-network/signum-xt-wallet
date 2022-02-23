import { CurrencySymbol } from '@signumjs/util';
import browser from 'webextension-polyfill';

import { browserInfo } from '../../browser-info';
import { AssetMetadata } from './types';

export const TEZOS_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: 'TEZ',
  name: 'Tezos',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/tez.svg')
};

export const SIGNA_METADATA: AssetMetadata = {
  decimals: 8,
  symbol: browserInfo.name === 'Safari' ? 'SIGNA' : CurrencySymbol,
  name: 'Signa',
  thumbnailUri: browser.runtime.getURL('misc/token-logos/signa.svg')
};
