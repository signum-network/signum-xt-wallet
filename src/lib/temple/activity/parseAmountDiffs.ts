import {
  getRecipientAmountsFromMultiOutPayment,
  isMultiOutSameTransaction,
  isMultiOutTransaction,
  Transaction,
  TransactionMiningSubtype,
  TransactionType
} from '@signumjs/core';
import { Amount } from '@signumjs/util';

interface ParseAmountDiffs {
  diff: string;
}

const isCommitmentTransaction = (tx: Transaction): boolean =>
  tx.type === TransactionType.Mining &&
  (tx.subtype === TransactionMiningSubtype.AddCommitment || tx.subtype === TransactionMiningSubtype.RemoveCommitment);

export function parseAmountDiffs(tx: Transaction, accountId: string): ParseAmountDiffs {
  let amount = Amount.fromPlanck(tx.amountNQT || '0');
  let isIncoming = tx.recipient === accountId; // common transaction

  if (isMultiOutTransaction(tx) || isMultiOutSameTransaction(tx)) {
    const outs = getRecipientAmountsFromMultiOutPayment(tx);
    const found = outs.find(p => p.recipient === accountId);
    isIncoming = !!found;
    amount = Amount.fromPlanck(found ? found.amountNQT : '0');
  }

  if (isCommitmentTransaction(tx)) {
    amount = Amount.fromPlanck(tx.attachment.amountNQT);
  }

  const result = {
    diff: amount.getSigna()
  };
  if (tx.sender === accountId && tx.recipient !== accountId) {
    result.diff = amount.multiply(-1).getSigna();
  } else if (isIncoming) {
    result.diff = amount.getSigna();
  }
  return result;
}
