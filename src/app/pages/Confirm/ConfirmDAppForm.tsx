import React, { FC, Fragment, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import Alert from 'app/atoms/Alert';
import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import DAppLogo from 'app/templates//DAppLogo';
import NetworkBanner from 'app/templates//NetworkBanner';
import AccountBanner from 'app/templates/AccountBanner';
import ConnectBanner from 'app/templates/ConnectBanner';
import { CustomRpsContext } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import {
  TempleAccountType,
  TempleDAppPayload,
  useAccount,
  useRelevantAccounts,
  useTempleClient
} from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';
import { useLocation } from 'lib/woozie';

import { withErrorHumanDelay } from '../../../lib/ui/humanDelay';
import { ConfirmPageSelectors } from './ConfirmPage.selectors';
import PayloadContent from './PayloadContent';

const ConfirmDAppForm: FC = () => {
  const { getDAppPayload, confirmDAppPermission, confirmDAppSign } = useTempleClient();
  const relevantAccounts = useRelevantAccounts(false);
  const account = useAccount();

  const [accountPkhToConnect, setAccountPkhToConnect] = useState(account.publicKeyHash);

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  const { data } = useRetryableSWR<TempleDAppPayload>([id], getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;
  const allAccounts = useMemo(
    () => relevantAccounts.filter(({ type }) => type !== TempleAccountType.WatchOnly),
    [relevantAccounts]
  );

  const connectedAccount = useMemo(
    () =>
      allAccounts.find(a => a.publicKeyHash === (payload.type === 'connect' ? accountPkhToConnect : payload.sourcePkh)),
    [payload, allAccounts, accountPkhToConnect]
  );

  const onConfirm = useCallback(
    async (confimed: boolean) => {
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confimed, accountPkhToConnect);
        case 'sign':
          return confirmDAppSign(id, confimed);
      }
    },
    [id, payload.type, confirmDAppPermission, confirmDAppSign, accountPkhToConnect]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed);
      } catch (err: any) {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError(err);
        });
      }
    },
    [onConfirm, setError]
  );

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

  const content = useMemo(() => {
    switch (payload.type) {
      case 'connect':
        return {
          title: t('confirmAction', t('connection').toLowerCase()),
          declineActionTitle: t('cancel'),
          declineActionTestID: ConfirmPageSelectors.ConnectAction_CancelButton,
          confirmActionTitle: error ? t('retry') : t('connect'),
          confirmActionTestID: error
            ? ConfirmPageSelectors.ConnectAction_RetryButton
            : ConfirmPageSelectors.ConnectAction_ConnectButton,
          want: (
            <T
              id="appWouldLikeToConnectToYourWallet"
              substitutions={[
                <Fragment key="appName">
                  <span className="font-semibold">{payload.origin}</span>
                  <br />
                </Fragment>
              ]}
            >
              {message => <p className="mb-2 text-sm text-center text-gray-700">{message}</p>}
            </T>
          )
        };

      case 'sign':
        return {
          title: t('confirmAction', t('signAction').toLowerCase()),
          declineActionTitle: t('reject'),
          declineActionTestID: ConfirmPageSelectors.SignAction_RejectButton,
          confirmActionTitle: t('signAction'),
          confirmActionTestID: ConfirmPageSelectors.SignAction_SignButton,
          want: (
            <div className={classNames('mb-2 text-sm text-center text-gray-700', 'flex flex-col items-center')}>
              <div className="flex items-center justify-center">
                <DAppLogo origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: '10rem' }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestsToSign"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>
                ]}
              />
            </div>
          )
        };
    }
  }, [payload.type, payload.origin, payload.appMeta.name, error]);

  return (
    <CustomRpsContext.Provider value={payload.networkRpc}>
      <div
        className="relative bg-white rounded-md shadow-md overflow-y-auto flex flex-col"
        style={{
          width: 400,
          height: 640
        }}
      >
        <div className="flex flex-col items-center p-4">
          <SubTitle small className={payload.type === 'connect' ? 'mt-4 mb-6' : 'mt-4 mb-2'}>
            {content.title}
          </SubTitle>

          {payload.type === 'connect' && (
            <ConnectBanner type={payload.type} origin={payload.origin} appMeta={payload.appMeta} className="mb-4" />
          )}

          {content.want}

          {payload.type === 'connect' && (
            <T id="viewAccountAddressWarning">
              {message => <p className="mb-4 text-xs font-light text-center text-gray-700">{message}</p>}
            </T>
          )}

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title="Error"
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              {payload.type !== 'connect' && connectedAccount && (
                <AccountBanner
                  account={connectedAccount}
                  networkRpc={payload.networkRpc}
                  labelIndent="sm"
                  className="w-full mb-4"
                />
              )}

              <NetworkBanner rpc={payload.networkRpc} narrow={payload.type === 'connect'} />
              <PayloadContent
                payload={payload}
                accountPkhToConnect={accountPkhToConnect}
                setAccountPkhToConnect={setAccountPkhToConnect}
              />
            </>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={classNames('sticky bottom-0 w-full', 'bg-white shadow-md', 'flex items-stretch', 'px-4 pt-2 pb-4')}
        >
          <div className="w-1/2 pr-2">
            <FormSecondaryButton
              type="button"
              className="justify-center w-full"
              loading={declining}
              onClick={handleDeclineClick}
              testID={content.declineActionTestID}
            >
              {content.declineActionTitle}
            </FormSecondaryButton>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton
              type="button"
              className="justify-center w-full"
              loading={confirming}
              onClick={handleConfirmClick}
              testID={content.confirmActionTestID}
            >
              {content.confirmActionTitle}
            </FormSubmitButton>
          </div>
        </div>
      </div>
    </CustomRpsContext.Provider>
  );
};

export default ConfirmDAppForm;
