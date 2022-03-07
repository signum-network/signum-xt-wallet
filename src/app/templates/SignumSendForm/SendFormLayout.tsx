import React, { Suspense, useCallback, useState } from 'react';

import OperationStatus from 'app/templates/OperationStatus';
import { t } from 'lib/i18n/react';
import { useAccount } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import AssetBanner from '../AssetBanner';
import AddContactModal from './AddContactModal';
import { SendForm } from './SendForm';
import { SpinnerSection } from './SpinnerSection';

const SendFormLayout = () => {
  const { accountId } = useAccount();
  const [operation, setOperation] = useSafeState<any>(null);
  const [contactAccountId, setContactAccountId] = useState<string | null>(null);

  const closeContactModal = useCallback(() => {
    setContactAccountId(null);
  }, [setContactAccountId]);

  return (
    <>
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} />}
      <AssetBanner assetSlug="signa" accountId={accountId} />
      <Suspense fallback={<SpinnerSection />}>
        <SendForm setOperation={setOperation} onAddContactRequested={setContactAccountId} />
      </Suspense>
      {contactAccountId && <AddContactModal accountId={contactAccountId} onClose={closeContactModal} />}
    </>
  );
};

export default SendFormLayout;
