import React, { FC, memo, useMemo } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import HashShortView from 'app/atoms/HashShortView';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Balance from 'app/templates/Balance';
import { OptionRenderProps } from 'app/templates/CustomSelect';
import SignView from 'app/templates/SignumSignView/SignView';
import { T } from 'lib/i18n/react';
import { XTAccount, TempleDAppPayload } from 'lib/messaging';
import { TempleDAppSignPayload, useRelevantAccounts, useSignumAssetMetadata } from 'lib/temple/front';

import IdenticonSignum from '../../atoms/IdenticonSignum';

const AccountIcon: FC<OptionRenderProps<XTAccount>> = ({ item }) => (
  <IdenticonSignum address={item.publicKey} size={32} className="flex-shrink-0 shadow-xs" />
);

const AccountOptionContentHOC = (networkRpc: string) => {
  const { symbol } = useSignumAssetMetadata();
  return memo<OptionRenderProps<XTAccount>>(({ item: acc }) => (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">{acc.name}</Name>
        <AccountTypeBadge account={acc} />
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className={classNames('text-xs leading-none', 'text-gray-700')}>
          <HashShortView hash={acc.publicKey} isAccount />
        </div>

        <Balance accountId={acc.accountId} networkRpc={networkRpc}>
          {bal => (
            <div className={classNames('ml-2', 'text-xs leading-none', 'text-gray-600')}>
              <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{symbol}</span>
            </div>
          )}
        </Balance>
      </div>
    </div>
  ));
};

interface PayloadContentProps {
  accountPkhToConnect: string;
  payload: TempleDAppPayload;
}

const PayloadContent: React.FC<PayloadContentProps> = ({ accountPkhToConnect, payload }) => {
  const allAccounts = useRelevantAccounts();
  const AccountOptionContent = useMemo(() => AccountOptionContentHOC(payload.network), [payload.network]);
  const currentAccount = useMemo(
    () => allAccounts.find((a: XTAccount) => a.publicKey === accountPkhToConnect),
    [allAccounts]
  );

  return payload.type === 'connect' ? (
    <div className={classNames('mt-4 p-2', 'w-full', 'flex flex-col', 'border rounded border-gray-200')}>
      <h2 className={classNames('leading-tight', 'flex flex-col')}>
        <T id="currentAccount">{message => <span className="text-base font-semibold text-gray-700">{message}</span>}</T>
        <div className="my-4 flex flex-row">
          <AccountIcon item={currentAccount!} index={1} />
          <span className="mr-2" />
          <AccountOptionContent item={currentAccount!} index={1} />
        </div>

        <T id="confirmConnectionHint">
          {message => <p className="mb-4 text-xs font-light text-center text-gray-700">{message}</p>}
        </T>
      </h2>
    </div>
  ) : (
    <SignView payload={payload as TempleDAppSignPayload} />
  );
};

export default PayloadContent;
