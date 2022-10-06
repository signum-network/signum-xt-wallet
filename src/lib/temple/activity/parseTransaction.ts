import {
  Address,
  Transaction,
  TransactionArbitrarySubtype,
  TransactionAssetSubtype,
  TransactionEscrowSubtype,
  TransactionMiningSubtype,
  TransactionSmartContractSubtype,
  TransactionType
} from '@signumjs/core';

import { SMART_CONTRACT_PUBLIC_KEY } from 'lib/temple/metadata';

import { SelfUpdateItem, TransactionItem, TransactionItemType } from './types';

function isPayment(tx: Transaction): boolean {
  return (
    tx.type === TransactionType.Payment ||
    (tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AssetTransfer) ||
    (tx.type === TransactionType.Asset && tx.subtype === 9) || // asset multi transfer
    (tx.type === TransactionType.Escrow && tx.subtype === TransactionEscrowSubtype.SubscriptionPayment)
  );
}

function isDistribution(tx: Transaction): boolean {
  return tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AssetDistributeToHolders;
}

function isSellTokenOrder(tx: Transaction): boolean {
  return tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AskOrderPlacement;
}

function isBuyTokenOrder(tx: Transaction): boolean {
  return tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.BidOrderPlacement;
}

function isMessage(tx: Transaction): boolean {
  return tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.Message;
}

function isSelfUpdate(tx: Transaction): boolean {
  return tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.AccountInfo;
}

function getSelfUpdateItem(tx: Transaction): SelfUpdateItem {
  let item: SelfUpdateItem = {
    type: TransactionItemType.SelfUpdate,
    prefix: '',
    i18nKey: ''
  };

  if (tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.AccountInfo) {
    item.prefix = 'ℹ';
    item.i18nKey = 'updateAccountInfo';
  } else if (tx.type === TransactionType.Mining && tx.subtype === TransactionMiningSubtype.AddCommitment) {
    item.prefix = '⚒';
    item.i18nKey = 'addCommitment';
    item.amount = tx.attachment.amountNQT;
  } else if (tx.type === TransactionType.Mining && tx.subtype === TransactionMiningSubtype.RemoveCommitment) {
    item.prefix = '⚒';
    item.i18nKey = 'removeCommitment';
    item.amount = tx.attachment.amountNQT;
  } else if (tx.type === TransactionType.Mining && tx.subtype === TransactionMiningSubtype.RewardRecipientAssignment) {
    item.prefix = '⚒';
    item.i18nKey = 'joinPool';
  } else if (tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.AliasAssignment) {
    item.prefix = '👤';
    item.i18nKey = 'aliasCreation';
  } else if (tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.AliasBuy) {
    item.prefix = '👤';
    item.i18nKey = 'aliasSell';
  } else if (tx.type === TransactionType.Arbitrary && tx.subtype === TransactionArbitrarySubtype.AliasSale) {
    item.prefix = '👤';
    item.i18nKey = 'aliasBuy';
  } else if (tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AssetIssuance) {
    item.prefix = '🪙';
    item.i18nKey = 'tokenIssuance';
  } else if (tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AssetMint) {
    item.prefix = '🪙';
    item.i18nKey = 'tokenMint';
  } else if (tx.type === TransactionType.Asset && tx.subtype === TransactionAssetSubtype.AssetAddTreasureyAccount) {
    item.prefix = '🏦';
    item.i18nKey = 'addTreasuryAccount';
  }
  return item;
}

function isContractCreation(tx: Transaction): boolean {
  return tx.type === TransactionType.AT && tx.subtype === TransactionSmartContractSubtype.SmartContractCreation;
}

function isContractTransaction(tx: Transaction): boolean {
  return tx.senderPublicKey === SMART_CONTRACT_PUBLIC_KEY;
}

export function parseTransaction(
  tx: Transaction,
  accountId: string,
  accountPrefix: string,
  isTokenView: boolean
): TransactionItem {
  // @ts-ignore
  let item: TransactionItem = {
    from: tx.senderRS,
    to: tx.recipientRS || ''
  };

  if (isPayment(tx)) {
    item.type = tx.sender === accountId ? TransactionItemType.TransferTo : TransactionItemType.TransferFrom;
  } else if (isDistribution(tx)) {
    item.type = tx.sender === accountId ? TransactionItemType.DistributionTo : TransactionItemType.DistributionFrom;
    // item.tokenId = tx.distribution.distributedAssetId!
  } else if (isMessage(tx)) {
    item.type = tx.sender === accountId ? TransactionItemType.MessageTo : TransactionItemType.MessageFrom;
    // @ts-ignore
    item.isEncrypted = tx.attachment.encryptedMessage;
  } else if (isContractCreation(tx)) {
    item.type = TransactionItemType.Origination;
    // @ts-ignore
    item.contract = Address.fromNumericId(tx.transaction, accountPrefix).getReedSolomonAddress();
  } else if (isContractTransaction(tx)) {
    item.type = TransactionItemType.Interaction;
    // @ts-ignore
    item.contract = Address.fromNumericId(tx.sender, accountPrefix).getReedSolomonAddress();
  } else if (isSelfUpdate(tx)) {
    item = getSelfUpdateItem(tx);
  } else if (isBuyTokenOrder(tx)) {
    item.type = TransactionItemType.BuyOrder;
    // @ts-ignore
    item.fulfilled = isTokenView;
  } else if (isSellTokenOrder(tx)) {
    item.type = TransactionItemType.SellOrder;
    // @ts-ignore
    item.fulfilled = isTokenView;
  } else {
    item.type = TransactionItemType.Other;
    // TODO: name the type more precisely
    // @ts-ignore
    item.name = '';
  }
  return item;
}
