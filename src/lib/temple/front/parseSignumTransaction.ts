import {
  getRecipientAmountsFromMultiOutPayment,
  Ledger,
  Transaction,
  TransactionArbitrarySubtype,
  TransactionAssetSubtype,
  TransactionMiningSubtype,
  TransactionPaymentSubtype,
  TransactionSmartContractSubtype,
  TransactionType
} from '@signumjs/core';
import BigNumber from 'bignumber.js';

import { BURN_ADDRESS, SIGNA_TOKEN_ID } from 'lib/temple/metadata';

export type ParsedTransactionExpense = {
  tokenAddress?: string;
  tokenId?: string;
  tokenDecimals?: string;
  aliasName?: string;
  hash?: string;
  amount?: BigNumber;
  price?: BigNumber;
  quantity?: BigNumber;
  to: string;
};

export interface ParsedTransactionType {
  hasAmount: boolean;
  i18nKey: string;
  textIcon: string;
}

export type ParsedTransaction = {
  txType: number;
  txSubtype: number;
  amount?: BigNumber;
  delegate?: string;
  type: ParsedTransactionType;
  isEntrypointInteraction: boolean;
  contractAddress?: string;
  expenses: ParsedTransactionExpense[];
  fee: BigNumber;
  isSelf: boolean;
  isDistribution: boolean;
};

const throwInappropriateTransactionType = () => {
  throw new Error('Inappropriate Transaction Type');
};

async function isContractInteraction(signum: Ledger, recipientId: string): Promise<boolean> {
  try {
    await signum.contract.getContract(recipientId);
    return true;
  } catch (e) {
    return false;
  }
}

function isDistribution(tx: Transaction): boolean {
  return tx.type === TransactionType.Asset && tx.subtype == TransactionAssetSubtype.AssetDistributeToHolders;
}

function isTransactionToSelf(tx: Transaction): boolean {
  if (tx.type === TransactionType.Payment && tx.subtype !== TransactionPaymentSubtype.Ordinary) {
    return false;
  }

  if (!tx.recipient) {
    return true;
  }

  return tx.recipient === tx.sender;
}

/*
 * {"type":0,"subtype":0,"timestamp":234874675,"deadline":1440,"senderPublicKey":"c213e4144ba84af94aae2458308fae1f0cb083870c8f3012eea58147f3b09d4a","recipient":"6502115112683865257","recipientRS":"TS-K37B-9V85-FB95-793HN","amountNQT":"100000000","feeNQT":"735000","sender":"2402520554221019656","senderRS":"TS-QAJA-QW5Y-SWVP-4RVP4","height":2147483647,"version":1,"ecBlockId":"9556561047696549169","ecBlockHeight":384189,"verify":false,"requestProcessingTime":0}
 */

export async function parseSignumTransaction(
  transaction: string,
  signum: Ledger
): Promise<[ParsedTransaction, object]> {
  const jsonTx = JSON.parse(transaction) as Transaction;
  const contractInteraction = await isContractInteraction(signum, jsonTx.recipient || '');
  const expenses = parseTransactionExpenses(jsonTx);
  return [
    {
      amount: calculateAmount(jsonTx),
      expenses,
      fee: new BigNumber(jsonTx.feeNQT),
      contractAddress: contractInteraction ? jsonTx.recipient : undefined,
      delegate: undefined,
      isEntrypointInteraction: contractInteraction,
      type: parseTransactionType(jsonTx),
      isSelf: isTransactionToSelf(jsonTx),
      isDistribution: isDistribution(jsonTx),
      txType: jsonTx.type,
      txSubtype: jsonTx.subtype
    },
    jsonTx
  ];
}

function calculateAmount(tx: Transaction): BigNumber {
  if (tx.type === TransactionType.Payment && tx.subtype === TransactionPaymentSubtype.MultiOut) {
    const amounts = getRecipientAmountsFromMultiOutPayment(tx);
    return amounts.reduce((amount, { amountNQT }) => amount.plus(new BigNumber(amountNQT)), new BigNumber(0));
  }
  return new BigNumber(tx.amountNQT || 0);
}
// --- EXPENSES SECTION

function parseTransactionExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.type) {
    case TransactionType.Payment:
      return parsePaymentExpenses(tx);
    case TransactionType.Asset:
      return parseAssetExpenses(tx);
    case TransactionType.AT:
      return parseContractExpenses(tx);
    case TransactionType.Arbitrary:
      return parseArbitraryExpenses(tx);
    case TransactionType.Mining:
      return parseMiningExpenses(tx);
    default:
      return [];
  }
}

function parseMiningExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.subtype) {
    case TransactionMiningSubtype.AddCommitment:
    case TransactionMiningSubtype.RemoveCommitment:
      return [
        {
          to: tx.sender,
          amount: new BigNumber(tx?.attachment.amountNQT || 0)
        }
      ];
    case TransactionMiningSubtype.RewardRecipientAssignment:
      return [
        {
          to: tx.recipient!,
          amount: new BigNumber(0)
        }
      ];
  }
  return throwInappropriateTransactionType();
}

function parseContractExpenses(tx: Transaction): ParsedTransactionExpense[] {
  const amount = new BigNumber(tx?.amountNQT || 0);

  switch (tx.subtype) {
    case TransactionSmartContractSubtype.SmartContractCreation:
      return [
        {
          to: '',
          hash: tx.referencedTransactionFullHash || tx.senderPublicKey,
          amount
        }
      ];
    case TransactionSmartContractSubtype.SmartContractPayment:
    default:
      return [
        {
          to: tx.recipient!,
          amount
        }
      ];
  }
}

function parseArbitraryExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.subtype) {
    case TransactionArbitrarySubtype.AliasAssignment:
      return [
        {
          to: tx.sender,
          aliasName: tx.attachment.alias,
          amount: new BigNumber(0)
        }
      ];
    case TransactionArbitrarySubtype.AliasSale:
      return [
        {
          to: tx.recipient || tx.sender,
          aliasName: tx.attachment.alias || tx.attachment.uri,
          amount: new BigNumber(tx.attachment.priceNQT)
        }
      ];
    case TransactionArbitrarySubtype.AliasBuy:
      return [
        {
          to: tx.sender,
          aliasName: tx.attachment.alias || tx.attachment.uri,
          amount: new BigNumber(tx.amountNQT || 0)
        }
      ];
    case TransactionArbitrarySubtype.AccountInfo:
    case TransactionArbitrarySubtype.Message:
    default:
      return [
        {
          to: tx.recipient || tx.sender,
          amount: new BigNumber(0)
        }
      ];
  }
}

function parseAssetExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.subtype) {
    case TransactionAssetSubtype.AssetDistributeToHolders:
      const distExpenses: ParsedTransactionExpense[] = [
        {
          to: '',
          tokenId: tx.attachment.asset,
          quantity: new BigNumber(tx.attachment.quantityMinimumQNT),
          amount: new BigNumber(tx.amountNQT || 0)
        }
      ];
      if (tx.attachment.assetToDistribute && tx.attachment.assetToDistribute !== '0') {
        distExpenses.push({
          to: '',
          tokenId: tx.attachment.assetToDistribute,
          quantity: new BigNumber(tx.attachment.quantityQNT)
        });
      }
      return distExpenses;
    case TransactionAssetSubtype.AssetMultiTransfer:
      const multiExpenses: ParsedTransactionExpense[] = [];
      const amount = new BigNumber(tx.amountNQT || '0');
      if (amount.gte(0)) {
        multiExpenses.push({
          to: tx.recipient!,
          amount,
          tokenId: SIGNA_TOKEN_ID
        });
      }
      let index = 0;
      for (const tokenId of tx.attachment.assetIds) {
        multiExpenses.push({
          to: tx.recipient!,
          tokenId,
          quantity: new BigNumber(tx.attachment.quantitiesQNT[index])
        });
        ++index;
      }
      return multiExpenses;
    case TransactionAssetSubtype.AskOrderPlacement:
    case TransactionAssetSubtype.BidOrderPlacement:
      return [
        {
          to: '',
          tokenId: tx.attachment.asset,
          quantity: new BigNumber(tx.attachment.quantityQNT),
          price: new BigNumber(tx.attachment.priceNQT)
        }
      ];
    case TransactionAssetSubtype.AskOrderCancellation:
    case TransactionAssetSubtype.BidOrderCancellation:
      return [
        {
          to: '',
          tokenId: tx.attachment.asset
        }
      ];
    case TransactionAssetSubtype.AssetTransfer:
    default:
      return [
        {
          to: tx.recipient || BURN_ADDRESS,
          tokenId: tx.attachment.asset,
          quantity: new BigNumber(tx.attachment.quantityQNT)
        }
      ];
  }
}

function parsePaymentExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.subtype) {
    case TransactionPaymentSubtype.MultiOut:
    case TransactionPaymentSubtype.MultiOutSameAmount: {
      const recipientAmounts = getRecipientAmountsFromMultiOutPayment(tx);
      return recipientAmounts.map(({ recipient, amountNQT }) => ({
        to: recipient,
        amount: new BigNumber(amountNQT)
      }));
    }
    default:
      return [
        {
          to: tx.recipient || BURN_ADDRESS,
          amount: new BigNumber(tx?.amountNQT || 0)
        }
      ];
  }
}

// -- TYPE SECTION

function parseTransactionType(tx: Transaction): ParsedTransactionType {
  switch (tx.type) {
    case TransactionType.Payment:
      return parsePaymentSubType(tx);
    case TransactionType.Asset:
      return parseAssetSubType(tx);
    case TransactionType.AT:
      return parseATSubType(tx);
    case TransactionType.Arbitrary:
      return parseArbitrarySubType(tx);
    case TransactionType.Mining:
      return parseMiningSubType(tx);
    default:
      return {
        i18nKey: 'transaction',
        textIcon: '⚙',
        hasAmount: true
      };
  }
}

function parsePaymentSubType(tx: Transaction): ParsedTransactionType {
  return !tx.recipient
    ? {
        i18nKey: 'burn',
        textIcon: '🔥',
        hasAmount: true
      }
    : {
        i18nKey: 'transferTo',
        textIcon: '➡',
        hasAmount: true
      };
}
function parseAssetSubType(tx: Transaction): ParsedTransactionType {
  switch (tx.subtype) {
    case TransactionAssetSubtype.AssetTransfer:
    case TransactionAssetSubtype.AssetMultiTransfer:
      return !tx.recipient
        ? {
            i18nKey: 'burn',
            textIcon: '🔥',
            hasAmount: true
          }
        : {
            i18nKey: 'transferTo',
            textIcon: '➡',
            hasAmount: true
          };
    case TransactionAssetSubtype.AssetDistributeToHolders:
      return {
        i18nKey: 'distribution',
        textIcon: '🌦️',
        hasAmount: true
      };
    case TransactionAssetSubtype.AskOrderPlacement:
      return {
        i18nKey: 'createSaleOrder',
        textIcon: '💱',
        hasAmount: false
      };
    case TransactionAssetSubtype.BidOrderPlacement:
      return {
        i18nKey: 'createBuyOrder',
        textIcon: '💱',
        hasAmount: false
      };
    case TransactionAssetSubtype.AskOrderCancellation:
      return {
        i18nKey: 'cancelSaleOrder',
        textIcon: '💱❌',
        hasAmount: false
      };
    case TransactionAssetSubtype.BidOrderCancellation:
      return {
        i18nKey: 'cancelBuyOrder',
        textIcon: '💱❌',
        hasAmount: false
      };
  }
  return throwInappropriateTransactionType();
}

function parseATSubType(tx: Transaction): ParsedTransactionType {
  if (tx.subtype === TransactionSmartContractSubtype.SmartContractCreation) {
    return {
      i18nKey: 'contractCreation',
      textIcon: '🤖',
      hasAmount: true
    };
  }
  return throwInappropriateTransactionType();
}

function parseMiningSubType(tx: Transaction): ParsedTransactionType {
  switch (tx.subtype) {
    case TransactionMiningSubtype.RemoveCommitment:
      return {
        i18nKey: 'removeCommitment',
        textIcon: '⚒',
        hasAmount: false
      };
    case TransactionMiningSubtype.AddCommitment:
      return {
        i18nKey: 'addCommitment',
        textIcon: '⚒',
        hasAmount: true
      };
    case TransactionMiningSubtype.RewardRecipientAssignment:
      return {
        i18nKey: 'joinPool',
        textIcon: '⚒',
        hasAmount: false
      };
  }
  return throwInappropriateTransactionType();
}

function parseArbitrarySubType(tx: Transaction): ParsedTransactionType {
  switch (tx.subtype) {
    case TransactionArbitrarySubtype.Message:
      return {
        i18nKey: 'messageTo',
        textIcon: '✉',
        hasAmount: false
      };
    case TransactionArbitrarySubtype.AccountInfo:
      return {
        i18nKey: 'updateAccountInfo',
        textIcon: 'ℹ',
        hasAmount: false
      };
    case TransactionArbitrarySubtype.AliasAssignment:
      return {
        i18nKey: 'aliasCreation',
        textIcon: '👤',
        hasAmount: false
      };
    case TransactionArbitrarySubtype.AliasBuy:
      return {
        i18nKey: 'aliasBuy',
        textIcon: '👤',
        hasAmount: true
      };
    case TransactionArbitrarySubtype.AliasSale:
      return {
        i18nKey: 'aliasSell',
        textIcon: '👤',
        hasAmount: true
      };
    default:
      return throwInappropriateTransactionType();
  }
}
