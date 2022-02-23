import React, { memo, useMemo, useState } from 'react';

import classNames from 'clsx';

import { T, TProps } from '../../../lib/i18n/react';
import { OpStackItem, OpStackItemType } from '../../../lib/temple/activity';
import { OP_STACK_PREVIEW_SIZE } from '../../defaults';
import { ReactComponent as ChevronRightIcon } from '../../icons/chevron-right.svg';
import { ReactComponent as ChevronUpIcon } from '../../icons/chevron-up.svg';
import { ReactComponent as ClipboardIcon } from '../../icons/clipboard.svg';
import HashChip from '../HashChip';

type TxStackProps = {
  txStack: OpStackItem[];
  className?: string;
};

// TODO: Stacking is not necessary in Signum
const TxStack = memo<TxStackProps>(({ txStack, className }) => {
  const [expanded, setExpanded] = useState(false);

  const base = useMemo(() => txStack.filter((_, i) => i < OP_STACK_PREVIEW_SIZE), [txStack]);
  const rest = useMemo(() => txStack.filter((_, i) => i >= OP_STACK_PREVIEW_SIZE), [txStack]);

  const ExpandIcon = expanded ? ChevronUpIcon : ChevronRightIcon;

  return (
    <div className={classNames('flex flex-col', className)}>
      {base.map((item, i) => (
        <TxStackItemComponent key={i} item={item} />
      ))}

      {expanded && (
        <>
          {rest.map((item, i) => (
            <TxStackItemComponent key={i} item={item} />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <div className={classNames('flex items-center', expanded && 'mt-1')}>
          <button
            className={classNames('flex items-center', 'text-blue-600 opacity-75 hover:underline', 'leading-none')}
            onClick={() => setExpanded(e => !e)}
          >
            <ExpandIcon className={classNames('mr-1 h-3 w-auto', 'stroke-2 stroke-current')} />
            <T id={expanded ? 'less' : 'more'} />
          </button>
        </div>
      )}
    </div>
  );
});

export default TxStack;

type OpStackItemProps = {
  item: OpStackItem;
};

const TxStackItemComponent = memo<OpStackItemProps>(({ item }) => {
  const toRender = (() => {
    switch (item.type) {
      // FIXME: obsolete in Signum
      case OpStackItemType.Delegation:
        return {
          base: (
            <>
              <T id="delegation" />
            </>
          ),
          argsI18nKey: 'delegationToSmb',
          args: [item.to]
        };

      case OpStackItemType.Origination:
        return {
          base: (
            <>
              <T id="origination" />
            </>
          )
        };
      // FIXME: obsolete in Signum - or messages to smart contracts
      case OpStackItemType.Interaction:
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

      case OpStackItemType.TransferFrom:
        return {
          base: (
            <>
              ↓ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferFromSmb',
          args: [item.from]
        };

      case OpStackItemType.TransferTo:
        return {
          base: (
            <>
              ↑ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferToSmb',
          args: [item.to]
        };

      case OpStackItemType.Other:
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

      {toRender.argsI18nKey && <StackItemArgs i18nKey={toRender.argsI18nKey} args={toRender.args} className="ml-1" />}
    </div>
  );
});

type StackItemArgsProps = {
  i18nKey: TProps['id'];
  args: string[];
  className?: string;
};

const StackItemArgs = memo<StackItemArgsProps>(({ i18nKey, args, className }) => (
  <span className={classNames('font-light text-gray-500 text-xs', className)}>
    <T
      id={i18nKey}
      substitutions={args.map((value, index) => (
        <span key={index}>
          <HashChip className="text-blue-600 opacity-75" key={index} hash={value} type="link" />
          {index === args.length - 1 ? null : ', '}
        </span>
      ))}
    />
  </span>
));
