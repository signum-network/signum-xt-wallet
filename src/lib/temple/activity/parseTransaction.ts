import {
  Address,
  Transaction,
  TransactionEscrowSubtype,
  TransactionSmartContractSubtype,
  TransactionType
} from '@signumjs/core';

import { TransactionItem, TransactionItemType } from './types';

function isPayment(tx: Transaction): boolean {
  return (
    tx.type === TransactionType.Payment ||
    (tx.type === TransactionType.Escrow && tx.subtype === TransactionEscrowSubtype.SubscriptionPayment) ||
    (tx.type === TransactionType.AT && tx.subtype === TransactionSmartContractSubtype.SmartContractPayment)
  );
}

function isContractCreation(tx: Transaction): boolean {
  return tx.type === TransactionType.AT && tx.subtype === TransactionSmartContractSubtype.SmartContractCreation;
}

export function parseTransaction(tx: Transaction, accountId: string): TransactionItem {
  // @ts-ignore
  const item: TransactionItem = {
    from: tx.senderRS,
    to: tx.recipientRS || ''
  };

  if (isPayment(tx)) {
    item.type = tx.sender === accountId ? TransactionItemType.TransferTo : TransactionItemType.TransferFrom;
  } else if (isContractCreation(tx)) {
    item.type = TransactionItemType.Origination;
    // @ts-ignore
    item.contract = Address.fromNumericId(tx.transaction!).getReedSolomonAddress();
  } else {
    item.type = TransactionItemType.Other;
    // TODO: name the type more precisely
    // @ts-ignore
    item.name = '';
  }
  return item;
}
