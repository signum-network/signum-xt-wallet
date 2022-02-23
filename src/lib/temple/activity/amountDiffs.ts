import {
  getRecipientAmountsFromMultiOutPayment,
  isMultiOutSameTransaction,
  isMultiOutTransaction,
  Transaction
} from '@signumjs/core';
import { Amount } from '@signumjs/util';

interface AmountDiffs {
  diff: string;
}

export function parseAmountDiffs(tx: Transaction, accountId: string): AmountDiffs[] {
  // TODO: we do not need stacked diffs here
  let amount = Amount.fromPlanck(tx.amountNQT || '0');
  let isIncoming = tx.recipient === accountId; // common transaction

  if (isMultiOutTransaction(tx) || isMultiOutSameTransaction(tx)) {
    const outs = getRecipientAmountsFromMultiOutPayment(tx);
    const found = outs.find(p => p.recipient === accountId);
    isIncoming = !!found;
    amount = Amount.fromPlanck(found ? found.amountNQT : '0');
  }

  const result = {
    diff: Amount.Zero().getSigna()
  };
  if (tx.sender === accountId && tx.recipient !== accountId) {
    result.diff = amount.multiply(-1).getSigna();
  } else if (isIncoming) {
    result.diff = amount.getSigna();
  }
  return [result];
}
