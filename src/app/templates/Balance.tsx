import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { AccountBalances, ZeroAccountBalances, useBalance, SIGNA_TOKEN_ID } from 'lib/temple/front';

type BalanceProps = {
  accountId: string;
  children: (b: BigNumber, bals: AccountBalances) => ReactElement;
  tokenId?: string;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

const Balance = memo<BalanceProps>(
  ({ accountId, children, tokenId = SIGNA_TOKEN_ID, networkRpc, displayed, initial }) => {
    const { data: balances } = useBalance(tokenId, accountId, {
      networkRpc,
      suspense: false,
      displayed,
      initial
    });
    const exist = balances !== undefined;

    return useMemo(() => {
      const childNode = children(balances?.totalBalance || new BigNumber(0), balances || ZeroAccountBalances);

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
    }, [children, exist, balances]);
  }
);

export default Balance;
