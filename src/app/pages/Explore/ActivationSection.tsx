import React, { FC, useEffect, useState } from 'react';

import { Address } from '@signumjs/core';
import { HttpClientFactory, HttpError } from '@signumjs/http';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import { Button } from 'app/atoms/Button';
import Spinner from 'app/atoms/Spinner';
import { T, t } from 'lib/i18n/react';
import { useAccount, useNetwork, useSignum, useTempleClient } from 'lib/temple/front';

async function activateAccount(isTestnet: boolean, publicKey: string): Promise<void> {
  const activatorUrl = isTestnet
    ? process.env.XT_WALLET_ACTIVATOR_URL_TESTNET
    : process.env.XT_WALLET_ACTIVATOR_URL_MAINNET;

  if (!activatorUrl) {
    throw new Error("Require a 'XT_WALLET_ACTIVATOR_URL_TEST|MAINNET' environment variable to be set");
  }
  const accountId = Address.fromPublicKey(publicKey).getNumericId();
  const http = HttpClientFactory.createHttpClient(activatorUrl);
  const payload = {
    account: accountId,
    publickey: publicKey,
    ref: `xt-wallet-${process.env.VERSION}`
  };
  await http.post('/api/activate', payload);
}

export const ActivationSection: FC = () => {
  const { setAccountActivated, getSignumTransactionKeyPair } = useTempleClient();
  const account = useAccount();
  const signum = useSignum();
  const network = useNetwork();
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { data: isActivatedOnChain } = useSWR(
    ['getAccountActivationStatus', account.publicKeyHash, account.isActivated, signum],
    async () => {
      if (account.isActivated) {
        return true;
      }

      try {
        const acc = await signum.account.getAccount({
          accountId: account.publicKeyHash,
          includeCommittedAmount: false,
          includeEstimatedCommitment: false
        });
        // @ts-ignore
        return !!acc.publicKey;
      } catch (e) {
        return false;
      }
    },
    {
      revalidateOnMount: true,
      dedupingInterval: 10_000
    }
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showSuccessMessage) {
      timeout = setTimeout(() => setShowSuccessMessage(false), 5_000);
    }
    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [showSuccessMessage]);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const { publicKey } = await getSignumTransactionKeyPair(account.publicKeyHash);
      await activateAccount(network.type === 'test', publicKey);
      await setAccountActivated(account.publicKeyHash); // persistent
      setShowSuccessMessage(true); // transient
    } catch (e) {
      if (e instanceof HttpError) {
        setActivationError(e.data.message || e.message);
      } else {
        setActivationError(t('smthWentWrong'));
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="w-full flex flex-col justify-center items-center p-4 mb-4 border rounded-md mt-4 mx-auto max-w-sm ">
        <Alert
          type="success"
          title={t('accountActivationSuccessTitle')}
          description={t('accountActivationSuccessDescription')}
        />
      </div>
    );
  }

  return isActivatedOnChain === false && !account.isActivated ? (
    <div className="w-full flex flex-col justify-center items-center p-4 mb-4 border rounded-md mt-4 mx-auto max-w-sm">
      <Alert
        type="warn"
        title={t('accountActivationAlertTitle')}
        description={t('accountActivationAlertDescription')}
      />
      {activationError && (
        <div className="text-center mt-2 text-red-700 text-xs">{`${t('activationFailed')}: ${activationError}`}</div>
      )}
      <Button
        className="mt-4 w-1/2 justify-center text-center border-none h-auto"
        style={{
          padding: '10px 2rem',
          background: '#4198e0',
          color: '#ffffff',
          borderRadius: 4
        }}
        onClick={handleActivate}
        disabled={isActivating}
      >
        {isActivating ? (
          <Spinner theme="gray" className="mx-auto" style={{ width: '48px' }} />
        ) : (
          <T id={'activateAccount'} />
        )}
      </Button>
    </div>
  ) : null;
};
