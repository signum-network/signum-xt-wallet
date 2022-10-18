import { Address } from '@signumjs/core';

export function isSignumAddress(address: string): boolean {
  try {
    Address.create(address);
    return true;
  } catch (_) {
    return false;
  }
}
