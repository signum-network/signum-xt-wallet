import {
  Api,
  getRecipientAmountsFromMultiOutPayment,
  Transaction,
  TransactionArbitrarySubtype,
  TransactionMiningSubtype,
  TransactionPaymentSubtype,
  TransactionSmartContractSubtype,
  TransactionType
} from '@signumjs/core';
import BigNumber from 'bignumber.js';

export type ParsedTransactionExpense = {
  tokenAddress?: string;
  tokenId?: string;
  aliasName?: string;
  hash?: string;
  amount: BigNumber;
  to: string;
};

export interface ParsedTransactionType {
  hasAmount: boolean;
  i18nKey: string;
  textIcon: string;
}

export type ParsedTransaction = {
  amount?: BigNumber;
  delegate?: string;
  type: ParsedTransactionType;
  isEntrypointInteraction: boolean;
  contractAddress?: string;
  expenses: ParsedTransactionExpense[];
  fee: BigNumber;
  isSelf: boolean;
};

const throwInappropriateTransactionType = () => {
  throw new Error('Inappropriate Transaction Type');
};

async function isContractInteraction(signumApi: Api, recipientId: string): Promise<boolean> {
  try {
    await signumApi.contract.getContract(recipientId);
    return true;
  } catch (e) {
    return false;
  }
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
  accountAddress: string,
  signumApi: Api
): Promise<[ParsedTransaction, object]> {
  const jsonTx = JSON.parse(transaction) as Transaction;
  const contractInteraction = await isContractInteraction(signumApi, jsonTx.recipient || '');
  return [
    {
      amount: calculateAmount(jsonTx),
      fee: new BigNumber(jsonTx.feeNQT!),
      expenses: parseTransactionExpenses(jsonTx, accountAddress),
      contractAddress: contractInteraction ? jsonTx.recipient : undefined,
      delegate: undefined,
      isEntrypointInteraction: contractInteraction,
      type: parseTransactionType(jsonTx),
      isSelf: isTransactionToSelf(jsonTx)
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

function parseTransactionExpenses(tx: Transaction, senderAddress: string): ParsedTransactionExpense[] {
  switch (tx.type) {
    case TransactionType.Payment:
      return parsePaymentExpenses(tx);
    case TransactionType.Asset:
      return parseAssetExpenses(tx, senderAddress);
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
          to: tx.sender!,
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
          hash: tx.referencedTransactionFullHash || tx.senderPublicKey!,
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
          to: tx.sender!,
          aliasName: tx.attachment.alias,
          amount: new BigNumber(0)
        }
      ];
    case TransactionArbitrarySubtype.AliasSale:
      return [
        {
          to: tx.recipient || tx.sender!,
          aliasName: tx.attachment.alias || tx.attachment.uri,
          amount: new BigNumber(tx.attachment.priceNQT)
        }
      ];
    case TransactionArbitrarySubtype.AliasBuy:
      return [
        {
          to: tx.sender!,
          aliasName: tx.attachment.alias || tx.attachment.uri,
          amount: new BigNumber(tx.amountNQT || 0)
        }
      ];
    case TransactionArbitrarySubtype.AccountInfo:
    case TransactionArbitrarySubtype.Message:
    default:
      return [
        {
          to: tx.recipient || tx.sender!,
          amount: new BigNumber(0)
        }
      ];
  }
}

function parseAssetExpenses(tx: Transaction, senderAddress: string): ParsedTransactionExpense[] {
  // TODO: add asset expenses stuff
  return [];
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
          to: tx.recipient!,
          amount: new BigNumber(tx?.amountNQT || 0)
        }
      ];
  }
}

// -- TYPE SECTION

function parseTransactionType(tx: Transaction): ParsedTransactionType {
  switch (tx.type) {
    case TransactionType.Payment:
    case TransactionType.Asset:
      return {
        i18nKey: 'transferTo',
        textIcon: '➡',
        hasAmount: true
      };
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
