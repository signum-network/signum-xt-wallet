import React, { memo } from 'react';

import classNames from 'clsx';

import { T, TProps } from 'lib/i18n/react';
import { TransactionItem, TransactionItemType } from 'lib/temple/activity';

import { ReactComponent as ClipboardIcon } from '../../icons/clipboard.svg';
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
              <T id="origination" />
            </>
          )
        };
      // TODO: messages to smart contracts - problem: it has to be async to figure out if receiver is a contract
      case TransactionItemType.Interaction:
        return {
          base: (
            <>
              <ClipboardIcon className="mr-1 h-3 w-auto stroke-current" />
              <T id="interaction" />
            </>
          ),
          argsI18nKey: 'interactionWithContract',
          args: [item.with]
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

      case TransactionItemType.Other:
        return {
          // TODO: once we have proper naming, need to adjust this.
          base: item.name
            .split('_')
            .map(w => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
            .join(' ')
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
