import React, { FC, memo, useMemo } from 'react';

import { TransactionAssetSubtype, TransactionType } from '@signumjs/core';
import { Amount, ChainValue, convertAssetPriceToPlanck } from '@signumjs/util';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import IdenticonSignum from 'app/atoms/IdenticonSignum';
import Money from 'app/atoms/Money';
import { T, t } from 'lib/i18n/react';
import { BURN_ADDRESS, getAssetSymbol, SIGNA_TOKEN_ID, useSignumAssetMetadata } from 'lib/temple/front';
import {
  ParsedTransaction,
  ParsedTransactionExpense,
  ParsedTransactionType
} from 'lib/temple/front/parseSignumTransaction';

import AssetIcon from '../AssetIcon';

type TransactionViewProps = {
  transaction?: ParsedTransaction;
};

const TransactionView: FC<TransactionViewProps> = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <div className="text-gray-700 text-sm">
      <div className="relative rounded-md overflow-y-auto border flex flex-col text-gray-700 text-sm leading-tight h-40">
        {transaction.expenses.map((item, index, arr) => (
          <ExpenseViewItem
            key={index}
            expense={item}
            first={index === 0}
            last={index === arr.length - 1}
            type={transaction.type}
            isSelf={transaction.isSelf}
            isForTokenHolder={transaction.isDistribution && index === 0}
            txSubtype={transaction.txSubtype}
            txType={transaction.txType}
          />
        ))}
      </div>
    </div>
  );
};

export default TransactionView;

type ExpenseViewItemProps = {
  expense: ParsedTransactionExpense;
  type: ParsedTransactionType;
  first: boolean;
  last: boolean;
  isSelf: boolean;
  isForTokenHolder: boolean;
  txType: number;
  txSubtype: number;
};

function getExpenseView({ txType, txSubtype, expense, isForTokenHolder }: ExpenseViewItemProps) {
  if (
    txType === TransactionType.Asset &&
    (txSubtype === TransactionAssetSubtype.BidOrderPlacement || txSubtype === TransactionAssetSubtype.AskOrderPlacement)
  ) {
    return <OrderDisplay expense={expense} />;
  }

  if (isForTokenHolder) {
    return <ForTokenHolderDisplay expense={expense} />;
  }

  if (txType === TransactionType.Asset && txSubtype === TransactionAssetSubtype.AssetIssuance) {
    return <TokenIssuanceDisplay expense={expense} />;
  }

  return <OperationVolumeDisplay expense={expense} />;
}

const ExpenseViewItem: FC<ExpenseViewItemProps> = props => {
  const { expense, last, type } = props;
  const operationTypeLabel = useMemo(() => `${type.textIcon} ${t(type.i18nKey)}`, [type.textIcon, type.i18nKey]);
  const metadata = useSignumAssetMetadata(expense.tokenId || SIGNA_TOKEN_ID);
  const expenseView = getExpenseView(props);

  return (
    <div className={classNames('pt-3 pb-2 px-2 flex justify-start items-center', !last && 'border-b border-gray-200')}>
      <div className="mr-2">
        {expense.hash && <Identicon hash={expense.hash} type="bottts" size={40} className="shadow-xs" />}
        {expense.to && <IdenticonSignum address={expense.to} size={40} className="shadow-xs" />}
        {!expense.to && expense.tokenId && metadata && (
          <AssetIcon metadata={metadata} size={40} className="shadow-xs" />
        )}
      </div>

      <div className="flex-1 flex-col">
        <div className="mb-1 text-xs text-gray-500 font-light flex flex-wrap">
          <span className="mr-1 flex text-blue-600 opacity-100">{operationTypeLabel}</span>
          {expense.to && expense.to !== BURN_ADDRESS && <HashShortView hash={expense.to} isAccount />}
          {expense.aliasName && <HashShortView hash={expense.aliasName} />}
        </div>

        <div className="flex items-end flex-shrink-0 flex-wrap text-gray-800">{expenseView}</div>
      </div>
    </div>
  );
};

type ExpenseVolumeDisplayProps = {
  expense: ParsedTransactionExpense;
};

const OperationVolumeDisplay = memo<ExpenseVolumeDisplayProps>(({ expense }) => {
  const metadata = useSignumAssetMetadata(expense.tokenId || SIGNA_TOKEN_ID);

  if (!metadata) return null;

  const value = expense.quantity ? expense.quantity : expense.amount;
  const finalVolume = ChainValue.create(metadata.decimals)
    .setAtomic(value ? value.toString() : '0')
    .getCompound();

  return (
    <span className="text-sm">
      <span className="font-medium">
        <Money>{finalVolume}</Money>
      </span>{' '}
      {getAssetSymbol(metadata)}
    </span>
  );
});

const TokenIssuanceDisplay = memo<ExpenseVolumeDisplayProps>(({ expense }) => {
  const qnt = expense.quantity?.toString() || '0';
  const issuedQuantity = ChainValue.create(parseInt(expense.tokenDecimals || '0'))
    .setAtomic(qnt)
    .getCompound();
  return (
    <span className="text-sm">
      <span className="font-medium">
        <Money>{issuedQuantity}</Money>
        &nbsp;
        {expense.tokenName}
      </span>
    </span>
  );
});

const ForTokenHolderDisplay = memo<ExpenseVolumeDisplayProps>(({ expense }) => {
  const tokenMetadata = useSignumAssetMetadata(expense.tokenId);
  const signaMetadata = useSignumAssetMetadata();

  if (!tokenMetadata) return null;

  const distributionThreshold = expense.quantity?.gte(0)
    ? ChainValue.create(tokenMetadata.decimals)
        .setAtomic((expense.quantity || 0).toString())
        .getCompound()
    : null;

  const signaToBeDistributed = Amount.fromPlanck((expense.amount || 0).toString()).getSigna();

  return (
    <span className="text-sm">
      {distributionThreshold ? (
        <T
          id="distributionForAllWithAtLeast"
          substitutions={[
            <span className="font-medium">
              <Money>{signaToBeDistributed}</Money>
            </span>,
            signaMetadata.symbol,
            distributionThreshold,
            tokenMetadata.symbol
          ]}
        />
      ) : (
        <T
          id="distributionForAllWith"
          substitutions={[
            <span className="font-medium">
              <Money>{signaToBeDistributed}</Money>
            </span>,
            signaMetadata.symbol,
            tokenMetadata.symbol
          ]}
        />
      )}
    </span>
  );
});

const OrderDisplay = memo<ExpenseVolumeDisplayProps>(({ expense }) => {
  const tokenMetadata = useSignumAssetMetadata(expense.tokenId);
  const signaMetadata = useSignumAssetMetadata();

  if (!tokenMetadata) return null;

  const tokenQuantity = new BigNumber(
    ChainValue.create(tokenMetadata.decimals)
      .setAtomic(expense.quantity?.toString() || '0')
      .getCompound()
  );
  const price = Amount.fromPlanck(convertAssetPriceToPlanck(expense.price!.toString(), tokenMetadata.decimals));
  const totalSigna = price.clone().multiply(tokenQuantity.toNumber());

  return (
    <div className="text-sm flex flex-col">
      <span>
        <span className="font-medium">
          <Money>{tokenQuantity || 0}</Money>
        </span>
        {` ${getAssetSymbol(tokenMetadata)} `}
        <T id="eachFor" />{' '}
        <span className="font-medium">
          <Money>{price.getSigna() || 0}</Money>
        </span>
        {` ${getAssetSymbol(signaMetadata)} `}
      </span>
      <span>
        {' = '}
        <span className="font-medium">
          <Money>{totalSigna.getSigna() || 0}</Money>
        </span>
        {` ${getAssetSymbol(signaMetadata)} `}
      </span>
    </div>
  );
});
