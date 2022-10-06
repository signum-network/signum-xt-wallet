import { Ledger, Transaction } from '@signumjs/core';

export async function fetchTokenDistribution(transactionId: string, accountId: string, signum: Ledger) {
  return signum.transaction.getDistributionAmountsFromTransaction(transactionId, accountId);
}
