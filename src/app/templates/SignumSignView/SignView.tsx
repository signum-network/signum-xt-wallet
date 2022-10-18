import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { TransactionAssetSubtype, TransactionType } from '@signumjs/core';
import { Amount, ChainValue, convertAssetPriceToPlanck } from '@signumjs/util';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import {
  getAssetSymbol,
  TempleDAppSignPayload,
  useAllTokensBaseMetadata,
  useSignum,
  useSignumAssetMetadata
} from 'lib/temple/front';
import { parseSignumTransaction, ParsedTransaction } from 'lib/temple/front/parseSignumTransaction';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

import Alert from '../../atoms/Alert';
import JsonView from '../JsonView';
import TransactionView from './TransactionView';

type OperationViewProps = {
  payload: TempleDAppSignPayload;
};

const SignView: FC<OperationViewProps> = ({ payload }) => {
  const SigningViewFormats = [
    {
      key: 'preview',
      name: t('preview'),
      Icon: EyeIcon
    },
    {
      key: 'raw',
      name: t('raw'),
      Icon: CodeAltIcon
    }
  ];

  const signum = useSignum();
  const { symbol } = useSignumAssetMetadata();
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null);
  const [jsonTransaction, setJsonTransaction] = useState<object>({});
  const [signViewFormat, setSignViewFormat] = useState(SigningViewFormats[0]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!payload) return;
    parseSignumTransaction(payload.preview, signum)
      .then(([txParsed, txJson]) => {
        setParsedTransaction(txParsed);
        setJsonTransaction(txJson);
      })
      .catch(async err => {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError(t('failedToParseTransactionData'));
        });
      });
  }, [payload, signum]);

  const totalSigna = useMemo(() => {
    if (!parsedTransaction) return '';
    const signa = Amount.fromPlanck(parsedTransaction.fee.toString());
    if (parsedTransaction.amount) {
      signa.add(Amount.fromPlanck(parsedTransaction.amount.toString()));
    }
    return signa.getSigna();
  }, [parsedTransaction]);

  const totalQuantities = useMemo(() => {
    if (!parsedTransaction) return [];
    const { expenses, txType, txSubtype } = parsedTransaction;

    const isSellOrder = txType === TransactionType.Asset && txSubtype === TransactionAssetSubtype.AskOrderPlacement;
    const isBuyOrder = txType === TransactionType.Asset && txSubtype === TransactionAssetSubtype.BidOrderPlacement;
    const isMinting = txType === TransactionType.Asset && txSubtype === TransactionAssetSubtype.AssetMint;

    return expenses
      .filter(({ tokenId, quantity }) => tokenId && quantity && !isMinting)
      .map(({ tokenId, quantity, price }) => ({
        tokenId: tokenId!,
        quantity: quantity!,
        price: isBuyOrder ? price : undefined,
        isReserved: isBuyOrder || isSellOrder
      }));
  }, [parsedTransaction]);

  const handleErrorAlertClose = useCallback(() => setError(''), [setError]);

  if (!parsedTransaction) return null;

  if (error) {
    return (
      <Alert
        closable
        onClose={handleErrorAlertClose}
        type="error"
        title="Error"
        description={error}
        className="my-4"
        autoFocus
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="mb-3 leading-tight flex items-center">
        <T id="payloadToSign">
          {message => <span className="mr-2 text-base font-semibold text-gray-700">{message}</span>}
        </T>

        <div className="flex-1" />

        <ViewsSwitcher activeItem={signViewFormat} items={SigningViewFormats} onChange={setSignViewFormat} />
      </h2>

      <JsonView
        jsonObject={jsonTransaction}
        className={classNames(signViewFormat.key !== 'raw' && 'hidden')}
        jsonViewStyle={{ maxHeight: '100%', overflow: 'auto' }}
      />

      <div className={classNames(signViewFormat.key !== 'preview' && 'hidden')}>
        <TransactionView transaction={parsedTransaction} />
      </div>

      <div className="mt-4 leading-tight flex text-base font-semibold text-gray-700 items-start justify-between w-full">
        <span>{t('totalAmount')}</span>
        <div className="flex flex-col w-1/2 text-right">
          <div>
            <Money>{totalSigna}</Money>&nbsp;{symbol}
          </div>
          <div>
            {totalQuantities.map((quantities, index) => (
              <TotalQuantityDisplay key={index} {...quantities} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignView;

interface TotalQuantityProps {
  tokenId: string;
  quantity: BigNumber;
  price?: BigNumber;
  isReserved: boolean;
}

const TotalQuantityDisplay = memo<TotalQuantityProps>(({ tokenId, quantity, price, isReserved }) => {
  const tokenMetadata = useSignumAssetMetadata(tokenId);
  const signaMetadata = useSignumAssetMetadata();

  if (!tokenMetadata) return null;

  const tokenQuantity = new BigNumber(
    ChainValue.create(tokenMetadata.decimals)
      .setAtomic(quantity.toString() || '0')
      .getCompound()
  );

  const pricePlanck = price ? convertAssetPriceToPlanck(price.toString(10), tokenMetadata.decimals) : '';
  const priceSigna = pricePlanck
    ? new BigNumber(Amount.fromPlanck(pricePlanck).multiply(tokenQuantity.toNumber()).getSigna())
    : null;
  return (
    <div className="text-sm flex flex-row justify-end items-baseline">
      {isReserved && <span className="text-xs font-normal mr-1">{t('reserving')}</span>}
      <span className="font-medium mr-1">
        <Money>{priceSigna ? priceSigna : tokenQuantity}</Money>
      </span>
      {getAssetSymbol(priceSigna ? signaMetadata : tokenMetadata)}
    </div>
  );
});
