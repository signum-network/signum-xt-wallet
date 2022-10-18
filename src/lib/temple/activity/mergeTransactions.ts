import { Transaction } from '@signumjs/core';

export function mergeTransactions(base?: Transaction[], toAppend: Transaction[] = []) {
  if (!base) return [];

  const uniqueIds = new Set<string>();
  const uniques: Transaction[] = [];
  const transactions = [...base, ...toAppend];
  for (const tx of transactions) {
    if (!uniqueIds.has(tx.transaction)) {
      uniqueIds.add(tx.transaction);
      uniques.push(tx);
    }
  }
  return uniques;
}
