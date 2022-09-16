import React, { memo } from 'react';

import classNames from 'clsx';

import { T, TProps } from 'lib/i18n/react';
import { TransactionItem, TransactionItemType } from 'lib/temple/activity';

import HashChip from '../HashChip';

type TxItemProps = {
  item: TransactionItem;
  className?: string;
};

const TxItem = memo<TxItemProps>(({ item, className }) => {
  return (
    <div className={classNames('flex flex-col', className)}>
      <TxItemComponent item={item} />
    </div>
  );
});

export default TxItem;

type TxItemComponentProps = {
  item: TransactionItem;
};

const TxItemComponent = memo<TxItemComponentProps>(({ item }) => {
  const toRender = (() => {
    switch (item.type) {
      case TransactionItemType.Origination:
        return {
          base: (
            <>
              🤖&nbsp;
              <T id="origination" />
            </>
          ),
          argsI18nKey: 'originationOf',
          args: [item.contract]
        };
      case TransactionItemType.Interaction:
        return {
          base: (
            <>
              ⚙&nbsp;
              <T id="interaction" />
            </>
          ),
          argsI18nKey: 'interactionWithContract',
          args: [item.contract]
        };

      case TransactionItemType.TransferFrom:
        return {
          base: (
            <>
              ↓ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferFromSmb',
          args: [item.from]
        };

      case TransactionItemType.TransferTo:
        return {
          base: (
            <>
              ↑ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferToSmb',
          args: [item.to]
        };
      case TransactionItemType.MessageFrom:
        return {
          base: (
            <>
              ↓{item.isEncrypted ? '🔐' : '✉'} <T id="p2pMessage" />
            </>
          ),
          argsI18nKey: 'transferFromSmb',
          args: [item.from]
        };
      case TransactionItemType.MessageTo:
        return {
          base: (
            <>
              ↑{item.isEncrypted ? '🔐' : '✉'} <T id="p2pMessage" />
            </>
          ),
          argsI18nKey: 'transferToSmb',
          args: [item.to]
        };
      case TransactionItemType.SelfUpdate:
        return {
          base: (
            <>
              {item.prefix} <T id={item.i18nKey} />
            </>
          )
        };
      case TransactionItemType.BuyOrder:
        return {
          base: <>↓ {item.fulfilled ? <T id="buyOrderFulfilled" /> : <T id="buyOrder" />}</>,
          argsI18nKey: item.fulfilled ? 'transferFromSmb' : undefined,
          args: [item.from]
        };
      case TransactionItemType.SellOrder:
        return {
          base: <>↑ {item.fulfilled ? <T id="saleOrderFulfilled" /> : <T id="saleOrder" />}</>,
          argsI18nKey: item.fulfilled ? 'transferToSmb' : undefined,
          args: [item.to]
        };
      case TransactionItemType.Other:
        return {
          base: (
            <>
              <T id={item.name} />
            </>
          )
        };
    }
  })();

  return (
    <div className="flex flex-wrap items-center">
      <div className={classNames('flex items-center', 'text-xs text-blue-600 opacity-75')}>{toRender.base}</div>

      {toRender.argsI18nKey && <TxItemArgs i18nKey={toRender.argsI18nKey} args={toRender.args} className="ml-1" />}
    </div>
  );
});

type TxItemArgsProps = {
  i18nKey: TProps['id'];
  args: string[];
  className?: string;
};

const TxItemArgs = memo<TxItemArgsProps>(({ i18nKey, args, className }) => (
  <span className={classNames('font-light text-gray-700 text-xs', className)}>
    <T
      id={i18nKey}
      substitutions={args.map((value, index) => (
        <span key={index}>
          <HashChip className="text-blue-600 opacity-75" key={index} hash={value} trimAfter={20} type="link" />
          {index === args.length - 1 ? null : ', '}
        </span>
      ))}
    />
  </span>
));
