import React, { FC, Suspense, useCallback, useState } from 'react';

import OperationStatus from 'app/templates/OperationStatus';
import { t } from 'lib/i18n/react';
import useSafeState from 'lib/ui/useSafeState';

import { useAccount } from '../../../lib/temple/front';
import AssetBanner from '../AssetBanner';
import AddContactModal from './AddContactModal';
import { SendForm } from './SendForm';
import { SpinnerSection } from './SpinnerSection';

type SendFormProps = {
  assetSlug?: string | null;
};

const SendFormLayout: FC<SendFormProps> = ({ assetSlug }) => {
  const account = useAccount();
  const [operation, setOperation] = useSafeState<any>(null);
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  // const { trackEvent } = useAnalytics();

  const handleAddContactRequested = useCallback(
    (address: string) => {
      setAddContactModalAddress(address);
    },
    [setAddContactModalAddress]
  );

  const closeContactModal = useCallback(() => {
    setAddContactModalAddress(null);
  }, [setAddContactModalAddress]);

  return (
    <>
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} />}
      <AssetBanner assetSlug="signa" accountId={account.publicKeyHash} />
      <Suspense fallback={<SpinnerSection />}>
        <SendForm setOperation={setOperation} onAddContactRequested={handleAddContactRequested} />
      </Suspense>
      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
};

export default SendFormLayout;
