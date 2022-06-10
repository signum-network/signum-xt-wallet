import React, { FC, memo, useMemo } from 'react';

import classNames from 'clsx';

import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import IdenticonSignum from 'app/atoms/IdenticonSignum';
import Money from 'app/atoms/Money';
import { t } from 'lib/i18n/react';
import { getAssetSymbol, useSignumAssetMetadata } from 'lib/temple/front';
import {
  ParsedTransaction,
  ParsedTransactionExpense,
  ParsedTransactionType
} from 'lib/temple/front/parseSignumTransaction';

type TransactionViewProps = {
  transaction?: ParsedTransaction;
  mainnet?: boolean;
};

const TransactionView: FC<TransactionViewProps> = ({ transaction, mainnet }) => {
  if (!transaction) return null;
  return (
    <div className="text-gray-700 text-sm">
      <div className="relative rounded-md overflow-y-auto border flex flex-col text-gray-700 text-sm leading-tight h-40">
        {transaction.expenses.map((item, index, arr) => (
          <ExpenseViewItem
            key={index}
            expense={item}
            last={index === arr.length - 1}
            mainnet={mainnet}
            type={transaction.type}
            isSelf={transaction.isSelf}
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
  last: boolean;
  mainnet?: boolean;
  isSelf: boolean;
};

const ExpenseViewItem: FC<ExpenseViewItemProps> = ({ expense, last, mainnet = false, type, isSelf }) => {
  const operationTypeLabel = useMemo(() => `${type.textIcon} ${t(type.i18nKey)}`, [type.textIcon, type.i18nKey]);

  return (
    <div className={classNames('pt-3 pb-2 px-2 flex justify-start items-center', !last && 'border-b border-gray-200')}>
      <div className="mr-2">
        {expense.hash ? (
          <Identicon hash={expense.hash} type="bottts" size={40} className="shadow-xs" />
        ) : (
          <IdenticonSignum address={expense.to} size={40} className="shadow-xs" />
        )}
      </div>

      <div className="flex-1 flex-col">
        <div className="mb-1 text-xs text-gray-500 font-light flex flex-wrap">
          <span className="mr-1 flex text-blue-600 opacity-100">{operationTypeLabel}</span>
          <HashShortView hash={expense.to} isAccount />
          {expense.aliasName && <HashShortView hash={expense.aliasName} />}
        </div>

        {type.hasAmount && expense.amount && (
          <div className="flex items-end flex-shrink-0 flex-wrap text-gray-800">
            <OperationVolumeDisplay expense={expense} mainnet={mainnet} />
          </div>
        )}
      </div>
    </div>
  );
};

type ExpenseVolumeDisplayProps = {
  expense: ParsedTransactionExpense;
  mainnet: boolean;
};

const OperationVolumeDisplay = memo<ExpenseVolumeDisplayProps>(({ expense, mainnet }) => {
  const metadata = useSignumAssetMetadata(); // consider asset slugs in the future
  const finalVolume = expense.amount.div(10 ** (metadata?.decimals || 0));

  return (
    <>
      <span className="text-sm">
        <span className="font-medium">
          <Money>{finalVolume || 0}</Money>
        </span>{' '}
        {getAssetSymbol(metadata, true)}
      </span>

      {/*{expense?.assetSlug && (*/}
      {/*  <InUSD volume={finalVolume || 0} assetSlug={expense.assetSlug} mainnet={mainnet}>*/}
      {/*    {usdVolume => (*/}
      {/*      <div className="text-xs text-gray-500 ml-1">*/}
      {/*        (<span className="mr-px">$</span>*/}
      {/*        {usdVolume})*/}
      {/*      </div>*/}
      {/*    )}*/}
      {/*  </InUSD>*/}
      {/*)}*/}
    </>
  );
});
