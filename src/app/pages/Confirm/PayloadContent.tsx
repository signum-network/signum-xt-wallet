import React, { FC, memo, useMemo } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import HashShortView from 'app/atoms/HashShortView';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Balance from 'app/templates/Balance';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import SignView from 'app/templates/SignumSignView/SignView';
import { T } from 'lib/i18n/react';
import { SIGNA_METADATA, TempleDAppSignPayload, useRelevantAccounts } from 'lib/temple/front';
import { TempleAccount, TempleDAppPayload } from 'lib/temple/types';

import IdenticonSignum from '../../atoms/IdenticonSignum';

const AccountIcon: FC<OptionRenderProps<TempleAccount>> = ({ item }) => (
  <IdenticonSignum accountId={item.publicKeyHash} size={32} className="flex-shrink-0 shadow-xs" />
);

const AccountOptionContentHOC = (networkRpc: string) => {
  return memo<OptionRenderProps<TempleAccount>>(({ item: acc }) => (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">{acc.name}</Name>
        <AccountTypeBadge account={acc} />
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className={classNames('text-xs leading-none', 'text-gray-700')}>
          <HashShortView hash={acc.publicKeyHash} isAccount />
        </div>

        <Balance accountId={acc.publicKeyHash} networkRpc={networkRpc}>
          {bal => (
            <div className={classNames('ml-2', 'text-xs leading-none', 'text-gray-600')}>
              <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{SIGNA_METADATA.symbol}</span>
            </div>
          )}
        </Balance>
      </div>
    </>
  ));
};

const getPkh = (account: TempleAccount) => account.publicKeyHash;

interface PayloadContentProps {
  accountPkhToConnect: string;
  setAccountPkhToConnect: (item: string) => void;
  payload: TempleDAppPayload;
}

const PayloadContent: React.FC<PayloadContentProps> = ({ accountPkhToConnect, setAccountPkhToConnect, payload }) => {
  const allAccounts = useRelevantAccounts(false);
  const AccountOptionContent = useMemo(() => AccountOptionContentHOC(payload.networkRpc), [payload.networkRpc]);

  return payload.type === 'connect' ? (
    <div className={classNames('w-full', 'flex flex-col')}>
      <h2 className={classNames('mb-2', 'leading-tight', 'flex flex-col')}>
        <T id="account">{message => <span className="text-base font-semibold text-gray-700">{message}</span>}</T>

        <T id="toBeConnectedWithDApp">
          {message => (
            <span className={classNames('mt-px', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
              {message}
            </span>
          )}
        </T>
      </h2>

      <CustomSelect<TempleAccount, string>
        activeItemId={accountPkhToConnect}
        getItemId={getPkh}
        items={allAccounts}
        maxHeight="8rem"
        onSelect={setAccountPkhToConnect}
        OptionIcon={AccountIcon}
        OptionContent={AccountOptionContent}
        autoFocus
      />
    </div>
  ) : (
    <SignView payload={payload as TempleDAppSignPayload} />
  );
};

export default PayloadContent;
