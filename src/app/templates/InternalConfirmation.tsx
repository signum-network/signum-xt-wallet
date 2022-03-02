import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import Alert from 'app/atoms/Alert';
import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Logo from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { useAppEnv } from 'app/env';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import AccountBanner from 'app/templates/AccountBanner';
import ExpensesView, { ModifyFeeAndLimit } from 'app/templates/ExpensesView';
import NetworkBanner from 'app/templates/NetworkBanner';
import RawPayloadView from 'app/templates/RawPayloadView';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { ViewsSwitcherItemProps } from 'app/templates/ViewsSwitcher/ViewsSwitcherItem';
import { T, t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import {
  XTAccountType,
  TempleConfirmationPayload,
  toTokenSlug,
  tryParseExpenses,
  useNetwork,
  useRelevantAccounts
} from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import { InternalConfirmationSelectors } from './InternalConfirmation.selectors';

type InternalConfiramtionProps = {
  payload: TempleConfirmationPayload;
  onConfirm: (confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => Promise<void>;
};

const MIN_GAS_FEE = 0;

// TODO: Do we need internal confirmation???
const InternalConfirmation: FC<InternalConfiramtionProps> = ({ payload, onConfirm }) => {
  const { networkName: currentNetworkName } = useNetwork();
  const { popup } = useAppEnv();

  const getContentToParse = useCallback(async () => {
    return [];
  }, [payload]);
  const { data: contentToParse } = useRetryableSWR(['content-to-parse'], getContentToParse, { suspense: true });

  const mainnet = true; //chainId === TempleChainId.Mainnet;

  const allAccounts = useRelevantAccounts();
  const account = useMemo(
    () => allAccounts.find(a => a.publicKeyHash === payload.sourcePkh)!,
    [allAccounts, payload.sourcePkh]
  );
  const rawExpensesData = useMemo(
    () => tryParseExpenses(contentToParse!, account.publicKeyHash),
    [contentToParse, account.publicKeyHash]
  );
  const expensesData = useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restProps }) => ({
      expenses: expenses.map(({ tokenAddress, tokenId, ...restProps }) => ({
        assetSlug: tokenAddress ? toTokenSlug(tokenAddress, tokenId) : 'tez',
        ...restProps
      })),
      ...restProps
    }));
  }, [rawExpensesData]);

  const signPayloadFormats: ViewsSwitcherItemProps[] = useMemo(() => {
    return [
      {
        key: 'preview',
        name: t('preview'),
        Icon: EyeIcon,
        testID: InternalConfirmationSelectors.PreviewTab
      },
      {
        key: 'bytes',
        name: t('bytes'),
        Icon: HashIcon,
        testID: InternalConfirmationSelectors.BytesTab
      }
    ];
  }, [payload]);

  const [spFormat, setSpFormat] = useSafeState(signPayloadFormats[0]);
  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const revealFee = useMemo(() => {
    return 0;
  }, [payload]);

  const [modifiedTotalFeeValue, setModifiedTotalFeeValue] = useSafeState(0);
  const [modifiedStorageLimitValue, setModifiedStorageLimitValue] = useSafeState(0);

  const gasFeeError = useMemo(() => modifiedTotalFeeValue <= MIN_GAS_FEE, [modifiedTotalFeeValue]);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed, modifiedTotalFeeValue - revealFee, modifiedStorageLimitValue);
      } catch (err: any) {
        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError, modifiedTotalFeeValue, modifiedStorageLimitValue, revealFee]
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

  const modifiedStorageLimitDisplayed = false;

  const modifyFeeAndLimit = useMemo<ModifyFeeAndLimit>(
    () => ({
      totalFee: modifiedTotalFeeValue,
      onTotalFeeChange: v => setModifiedTotalFeeValue(v),
      storageLimit: modifiedStorageLimitDisplayed ? modifiedStorageLimitValue : null,
      onStorageLimitChange: v => setModifiedStorageLimitValue(v)
    }),
    [
      modifiedTotalFeeValue,
      setModifiedTotalFeeValue,
      modifiedStorageLimitValue,
      setModifiedStorageLimitValue,
      modifiedStorageLimitDisplayed
    ]
  );

  // @ts-ignore
  return (
    <div className={classNames('h-full w-full', 'max-w-sm mx-auto', 'flex flex-col', !popup && 'justify-center px-2')}>
      <div className={classNames('flex flex-col items-center justify-center', popup && 'flex-1')}>
        <div className="flex items-center my-4">
          <Logo hasTitle />
        </div>
      </div>

      <div
        className={classNames(
          'relative bg-white shadow-md',
          popup ? 'border-t border-gray-200' : 'rounded-md',
          'overflow-y-auto',
          'flex flex-col'
        )}
        style={{ height: '34rem' }}
      >
        <div className="px-4 pt-3">
          <SubTitle small className="mb-4">
            <T id="confirmAction" substitutions={t(payload.type === 'sign' ? 'signAction' : 'operations')} />
          </SubTitle>

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title={t('error')}
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              <AccountBanner account={account} labelIndent="sm" className="w-full mb-4" />

              <NetworkBanner networkName={currentNetworkName} />

              {signPayloadFormats.length > 1 && (
                <div className="w-full flex justify-end mb-3 items-center">
                  <span className={classNames('mr-2', 'text-base font-semibold text-gray-700')}>
                    <T id="operations" />
                  </span>

                  <div className="flex-1" />

                  <ViewsSwitcher activeItem={spFormat} items={signPayloadFormats} onChange={setSpFormat} />
                </div>
              )}

              {payload.type === 'sign' && spFormat.key === 'bytes' && (
                <>
                  <RawPayloadView
                    label={t('payloadToSign')}
                    payload={payload.bytes}
                    className="mb-4"
                    style={{ height: '11rem' }}
                  />
                </>
              )}

              {spFormat.key === 'preview' && (
                <ExpensesView
                  expenses={expensesData}
                  modifyFeeAndLimit={modifyFeeAndLimit}
                  mainnet={mainnet}
                  gasFeeError={gasFeeError}
                />
              )}
            </>
          )}
          {spFormat.key === 'preview' && gasFeeError && (
            <p className="text-xs text-red-600 pt-1 h-4">
              <T id="gasFeeMustBePositive" />
            </p>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={classNames('sticky bottom-0 w-full', 'bg-white shadow-md', 'flex items-stretch', 'px-4 pt-2 pb-4')}
        >
          <div className="w-1/2 pr-2">
            <T id="decline">
              {message => (
                <FormSecondaryButton
                  type="button"
                  className="justify-center w-full"
                  loading={declining}
                  disabled={declining}
                  onClick={handleDeclineClick}
                  testID={InternalConfirmationSelectors.DeclineButton}
                >
                  {message}
                </FormSecondaryButton>
              )}
            </T>
          </div>

          <div className="w-1/2 pl-2">
            <T id={error ? 'retry' : 'confirm'}>
              {message => (
                <FormSubmitButton
                  type="button"
                  className="justify-center w-full"
                  disabled={gasFeeError}
                  loading={confirming}
                  onClick={handleConfirmClick}
                  testID={
                    error ? InternalConfirmationSelectors.RetryButton : InternalConfirmationSelectors.ConfirmButton
                  }
                >
                  {message}
                </FormSubmitButton>
              )}
            </T>
          </div>
        </div>

        <ConfirmLedgerOverlay displayed={confirming && account.type === XTAccountType.Ledger} />
      </div>
    </div>
  );
};

export default InternalConfirmation;
