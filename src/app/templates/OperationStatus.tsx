import React, { FC, ReactNode, useCallback, useEffect, useMemo } from 'react';

import classNames from 'clsx';

import Alert from 'app/atoms/Alert';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import HashChip from 'app/templates/HashChip';
import { T, t } from 'lib/i18n/react';
import { useSignum, useSignumExplorerBaseUrls } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import { useRetryableSWR } from '../../lib/swr';

type OperationStatusProps = {
  className?: string;
  closable?: boolean;
  onClose?: () => void;
  typeTitle: string;
  operation: any;
};

enum TxStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Confirmed = 'confirmed'
}

const OperationStatus: FC<OperationStatusProps> = ({ typeTitle, operation, className, closable, onClose }) => {
  const signum = useSignum();

  const checkForTransactionConfirmation = useCallback(
    async (_k: string, txId?: string): Promise<TxStatus | null> => {
      if (!txId) return null;

      const { confirmations } = await signum.transaction.getTransaction(txId);
      switch (confirmations) {
        case undefined:
          return TxStatus.Accepted;
        case 0: // broadcasted and accepted by network
        default:
          return TxStatus.Confirmed;
      }
    },
    [signum]
  );

  const { data: txStatus, error } = useRetryableSWR(
    ['checkForTransactionConfirmation', operation?.txId],
    checkForTransactionConfirmation,
    {
      initialData: TxStatus.Pending,
      refreshInterval: 5_000
    }
  );

  const { transaction: transactionBaseUrl } = useSignumExplorerBaseUrls();

  const descFooter = useMemo(
    () => (
      <div className="mt-2 text-xs flex items-center">
        <div className="whitespace-no-wrap">
          <T id="transaction" />:{' '}
        </div>
        <HashChip hash={operation.txId} firstCharsCount={10} lastCharsCount={7} small className="ml-2 mr-2" />
        {transactionBaseUrl && <OpenInExplorerChip baseUrl={transactionBaseUrl} hash={operation.txId} />}
      </div>
    ),
    [operation, transactionBaseUrl]
  );

  const [alert, setAlert] = useSafeState<{
    type: 'success' | 'error';
    title: string;
    description: ReactNode;
  }>(() => ({
    type: 'success',
    title: `${t('success')} 🛫`,
    description: (
      <>
        <T id="requestSent" substitutions={typeTitle} />
        {descFooter}
        <div className="flex-1" />
      </>
    )
  }));

  useEffect(() => {
    if (!txStatus) return;

    if (error) {
      console.log(error);
      setAlert({
        type: 'error',
        title: t('error'),
        description: error
      });
    }

    if (txStatus === TxStatus.Accepted) {
      setAlert(a => ({
        ...a,
        title: `${t('success')} ⚙`,
        description: (
          <>
            <T id="operationSuccessfullyAccepted" substitutions={typeTitle} />
            {descFooter}
          </>
        )
      }));
    }

    if (txStatus === TxStatus.Confirmed) {
      setAlert(a => ({
        ...a,
        title: `${t('success')} ✅`,
        description: (
          <>
            <T id="operationSuccessfullyProcessed" substitutions={typeTitle} />
            {descFooter}
          </>
        )
      }));
    }
  }, [txStatus, error, setAlert, descFooter, typeTitle]);

  return (
    <Alert
      type={alert.type}
      title={alert.title}
      description={alert.description}
      autoFocus
      className={classNames('mb-8', className)}
      closable={closable}
      onClose={onClose}
    />
  );
};

export default OperationStatus;
