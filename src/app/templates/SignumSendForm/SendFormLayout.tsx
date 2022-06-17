import React, { Suspense, useCallback, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as DollarIcon } from 'app/icons/dollar.svg';
import { ReactComponent as MessageIcon } from 'app/icons/sticker.svg';
import OperationStatus from 'app/templates/OperationStatus';
import { SendP2PMessageForm } from 'app/templates/SignumSendForm/SendP2PMessageForm';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { t } from 'lib/i18n/react';
import { useAccount } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import AssetBanner from '../AssetBanner';
import AddContactModal from './AddContactModal';
import { SendForm } from './SendForm';
import { SpinnerSection } from './SpinnerSection';

const SendFormLayout = () => {
  const TransactionFormats = [
    {
      key: 'transfer',
      name: t('transfer'),
      Icon: DollarIcon
    },
    {
      key: 'message',
      name: t('p2pMessage'),
      Icon: MessageIcon
    }
  ];

  const { accountId } = useAccount();
  const [operation, setOperation] = useSafeState<any>(null);
  const [contactAccountId, setContactAccountId] = useState<string | null>(null);
  const [transactionFormat, setTransactionFormat] = useState(TransactionFormats[0]);
  const closeContactModal = useCallback(() => {
    setContactAccountId(null);
  }, [setContactAccountId]);

  return (
    <>
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} />}
      <AssetBanner assetSlug="signa" accountId={accountId} />
      <hr className="mt-2" />
      <div className="mt-2">
        <ViewsSwitcher activeItem={transactionFormat} items={TransactionFormats} onChange={setTransactionFormat} />
      </div>
      <Suspense fallback={<SpinnerSection />}>
        <div className={classNames(transactionFormat.key !== 'transfer' && 'hidden')}>
          <SendForm setOperation={setOperation} onAddContactRequested={setContactAccountId} />
        </div>
        <div className={classNames(transactionFormat.key !== 'message' && 'hidden')}>
          <SendP2PMessageForm setOperation={setOperation} onAddContactRequested={setContactAccountId} />
        </div>
      </Suspense>
      {contactAccountId && <AddContactModal accountId={contactAccountId} onClose={closeContactModal} />}
    </>
  );
};

export default SendFormLayout;
