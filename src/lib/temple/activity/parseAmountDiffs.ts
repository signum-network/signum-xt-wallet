import {
  getRecipientAmountsFromMultiOutPayment,
  isMultiOutSameTransaction,
  isMultiOutTransaction,
  Transaction,
  TransactionAssetSubtype,
  TransactionMiningSubtype,
  TransactionType
} from '@signumjs/core';
import { Amount, ChainValue } from '@signumjs/util';

import { AssetMetadata, SIGNA_TOKEN_ID } from 'lib/temple/metadata';

interface ParseAmountDiffs {
  diff: string;
}

const isCommitmentTransaction = (tx: Transaction): boolean =>
  tx.type === TransactionType.Mining &&
  (tx.subtype === TransactionMiningSubtype.AddCommitment || tx.subtype === TransactionMiningSubtype.RemoveCommitment);

function parseSignaDiffs(tx: Transaction, accountId: string): ParseAmountDiffs {
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

function parseQuantityDiffs(tx: Transaction, accountId: string, tokenMetadata: AssetMetadata): ParseAmountDiffs {
  if (tx.type !== TransactionType.Asset) {
    return {
      diff: '0'
    };
  }

  let quantityQNT = tx.attachment.quantityQNT;
  if (tx.subtype === TransactionAssetSubtype.AssetMultiTransfer) {
    const index = tx.attachment.assetIds.findIndex((id: string) => id === tokenMetadata.id);
    if (index < 0) {
      console.warn(`Token id ${tokenMetadata.id} not available in asset multi transfer`);
      return {
        diff: '0'
      };
    }
    quantityQNT = tx.attachment.quantitiesQNT[index];
  }

  const isOutgoing =
    tx.subtype !== TransactionAssetSubtype.AssetMint &&
    tx.subtype !== TransactionAssetSubtype.AssetIssuance &&
    (tx.subtype === TransactionAssetSubtype.AssetDistributeToHolders || tx.recipient !== accountId);

  if (isOutgoing) {
    return {
      diff: ChainValue.create(tokenMetadata.decimals)
        .setAtomic('-' + quantityQNT)
        .getCompound()
    };
  }

  if (tx.distribution) {
    // received distribution
    return {
      diff: ChainValue.create(tokenMetadata.decimals).setAtomic(tx.distribution.quantityQNT).getCompound()
    };
  }

  return {
    // simple transfer
    diff: ChainValue.create(tokenMetadata.decimals).setAtomic(quantityQNT).getCompound()
  };
}

export function parseAmountDiffs(tx: Transaction, accountId: string, tokenMetadata: AssetMetadata): ParseAmountDiffs {
  return tokenMetadata.id === SIGNA_TOKEN_ID
    ? parseSignaDiffs(tx, accountId)
    : parseQuantityDiffs(tx, accountId, tokenMetadata);
}
