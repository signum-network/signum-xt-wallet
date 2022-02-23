import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useBalance } from 'lib/temple/front';

type BalanceProps = {
  accountId: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

const Balance = memo<BalanceProps>(({ accountId, children, assetSlug = 'tez', networkRpc, displayed, initial }) => {
  const { data: balance } = useBalance(assetSlug, accountId, {
    networkRpc,
    suspense: false,
    displayed,
    initial
  });
  const exist = balance !== undefined;

  return useMemo(() => {
    const childNode = children(balance || new BigNumber(0));

    return (
      <CSSTransition
        in={exist}
        timeout={200}
        classNames={{
          enter: 'opacity-0',
          enterActive: classNames('opacity-100', 'transition ease-out duration-200'),
          exit: classNames('opacity-0', 'transition ease-in duration-200')
        }}
      >
        {cloneElement(childNode, {
          className: classNames(childNode.props.className)
        })}
      </CSSTransition>
    );
  }, [children, exist, balance]);
});

export default Balance;
