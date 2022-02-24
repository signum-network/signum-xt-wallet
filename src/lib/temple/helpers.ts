import { Address } from '@signumjs/core';
import { ManagerKeyResponse, RpcClient } from '@taquito/rpc';
import { validateAddress, ValidationResult } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import memoize from 'micro-memoize';

import { FastRpcClient } from 'lib/taquito-fast-rpc';

export const loadFastRpcClient = memoize((rpc: string) => new FastRpcClient(rpc));

export const loadChainId = memoize(fetchChainId, {
  isPromise: true,
  maxSize: 100
});

export function fetchChainId(rpcUrl: string) {
  const rpc = new RpcClient(rpcUrl);
  return rpc.getChainId();
}

export function hasManager(manager: ManagerKeyResponse) {
  return manager && typeof manager === 'object' ? !!manager.key : !!manager;
}

export function assetAmountToUSD(amount?: BigNumber, assetUsdPrice?: number, roundingMode?: BigNumber.RoundingMode) {
  return !amount || assetUsdPrice === undefined
    ? undefined
    : amount.multipliedBy(assetUsdPrice).decimalPlaces(2, roundingMode ?? BigNumber.ROUND_DOWN);
}

export function usdToAssetAmount(
  usd?: BigNumber,
  assetUsdPrice?: number,
  assetDecimals?: number,
  roundingMode?: BigNumber.RoundingMode
) {
  return !usd || assetUsdPrice === undefined
    ? undefined
    : usd.div(assetUsdPrice).decimalPlaces(assetDecimals || 0, roundingMode ?? BigNumber.ROUND_DOWN);
}

export function tzToMutez(tz: any) {
  const bigNum = new BigNumber(tz);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.times(10 ** 6).integerValue();
}

export function mutezToTz(mutez: any) {
  const bigNum = new BigNumber(mutez);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.integerValue().div(10 ** 6);
}

export function atomsToTokens(x: BigNumber, decimals: number) {
  return x.integerValue().div(new BigNumber(10).pow(decimals));
}

export function tokensToAtoms(x: BigNumber, decimals: number) {
  return x.times(10 ** decimals).integerValue();
}

export function isSignumAddress(address: string): boolean {
  try {
    Address.create(address);
    return true;
  } catch (_) {
    return false;
  }
}

export function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isKTAddress(address: string) {
  return address?.startsWith('KT');
}

// TODO: obsolete, remove
export function validateDerivationPath(p: string) {
  if (!p.startsWith('m')) {
    return 'derivationPathMustStartWithM';
  }
  if (p.length > 1 && p[1] !== '/') {
    return 'derivationSeparatorMustBeSlash';
  }

  const parts = p.replace('m', '').split('/').filter(Boolean);
  if (
    !parts.every(p => {
      const pNum = +(p.includes("'") ? p.replace("'", '') : p);
      return Number.isSafeInteger(pNum) && pNum >= 0;
    })
  ) {
    return 'invalidPath';
  }

  return true;
}

// TODO: obsolete, remove me
export function validateContractAddress(value: any) {
  switch (false) {
    case isAddressValid(value):
      return 'invalidAddress';

    case isKTAddress(value):
      return 'onlyKTContractAddressAllowed';

    default:
      return true;
  }
}
