import {
  Address,
  Transaction,
  TransactionEscrowSubtype,
  TransactionSmartContractSubtype,
  TransactionType
} from '@signumjs/core';

import { OpStackItem, OpStackItemType } from './types';

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

export function parseTxStack(tx: Transaction, accountId: string): OpStackItem[] {
  // @ts-ignore
  const item: OpStackItem = {
    from: tx.senderRS,
    to: tx.recipientRS || ''
  };
  if (isPayment(tx)) {
    item.type = tx.sender === accountId ? OpStackItemType.TransferTo : OpStackItemType.TransferFrom;
  } else if (isContractCreation(tx)) {
    item.type = OpStackItemType.Origination;
    // @ts-ignore
    item.contract = Address.fromNumericId(tx.transaction!).getReedSolomonAddress();
  } else {
    item.type = OpStackItemType.Other;
    // TODO: name the type more precisely
    // @ts-ignore
    item.name = '';
  }

  // we have only a single object.... but need to align structure with pre-existing code
  // TODO: get rid of array / stack structure
  return [item];
}
