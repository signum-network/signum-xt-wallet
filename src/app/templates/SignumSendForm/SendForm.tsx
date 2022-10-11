import React, { Dispatch, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Address, AttachmentEncryptedMessage, AttachmentMessage, TransactionId } from '@signumjs/core';
import { encryptMessage } from '@signumjs/crypto';
import { Amount, ChainValue, FeeQuantPlanck } from '@signumjs/util';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import AssetField from 'app/atoms/AssetField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Money from 'app/atoms/Money';
import NoSpaceField from 'app/atoms/NoSpaceField';
import { useAppEnv } from 'app/env';
import { MessageForm, MessageFormData } from 'app/templates/SignumSendForm/MessageForm';
import { useFormAnalytics } from 'lib/analytics';
import { toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import {
  BURN_ADDRESS,
  isSignumAddress,
  SIGNA_TOKEN_ID,
  SMART_CONTRACT_PUBLIC_KEY,
  useAccount,
  useBalance,
  useSignum,
  useSignumAccountPrefix,
  useSignumAliasResolver,
  useSignumAssetMetadata,
  useTempleClient
} from 'lib/temple/front';
import { useFilteredContacts } from 'lib/temple/front/use-filtered-contacts.hook';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';
import useSafeState from 'lib/ui/useSafeState';

import ContactsDropdown from './ContactsDropdown';
import FeeInput from './FeeInput';
import FilledContact from './FilledContact';
import SendErrorAlert from './SendErrorAlert';

interface FormData {
  to: string;
  amount: string;
  fee: string;
}

type FormProps = {
  tokenId: string;
  recipient?: string;
  setOperation: Dispatch<any>;
  onAddContactRequested: (address: string) => void;
};

const MinimumFee = Amount.fromPlanck(FeeQuantPlanck).getSigna();

export const SendForm: FC<FormProps> = ({ setOperation, onAddContactRequested, tokenId, recipient }) => {
  const messageFormRef = useRef();
  const { registerBackHandler } = useAppEnv();
  const assetMetadata = useSignumAssetMetadata(tokenId);
  const signumMetadata = useSignumAssetMetadata(SIGNA_TOKEN_ID);
  const { resolveAliasToAccountPk } = useSignumAliasResolver();
  const formAnalytics = useFormAnalytics('SendForm');
  const { allContacts } = useFilteredContacts();
  const acc = useAccount();
  const signum = useSignum();
  const prefix = useSignumAccountPrefix();
  const client = useTempleClient();
  const [messageFormData, setMessageFormData] = useState<MessageFormData>({
    message: '',
    isBinary: false,
    isValid: true,
    isEncrypted: false
  });
  const [feeValue, setFeeValue] = useState(MinimumFee);

  const assetSymbol = assetMetadata.symbol;
  const assetDecimals = assetMetadata.decimals;
  const signaSymbol = signumMetadata.symbol;
  const publicKey = acc.publicKey;
  const accountId = acc.accountId;
  const isSignaToken = tokenId === SIGNA_TOKEN_ID;
  const { data: balanceData } = useBalance(tokenId, accountId);

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation, reset } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      to: recipient
    }
  });

  const toValue = watch('to');
  const amountValue = watch('amount');

  const toFieldRef = useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = useRef<HTMLInputElement>(null);

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isSignumAddress(toValue)), [toValue]);

  const toFilledWithAlias = useMemo(() => toValue && !isSignumAddress(toValue), [toValue]);

  const addressResolver = useCallback(
    async (_k: string, address: string) => {
      try {
        const id = Address.create(address).getNumericId();
        if (id === BURN_ADDRESS) {
          return null;
        }
        const { publicKey } = await signum.account.getAccount({
          accountId: id,
          includeEstimatedCommitment: false,
          includeCommittedAmount: false
        });
        return publicKey;
      } catch (e) {
        return resolveAliasToAccountPk(address);
      }
    },
    [resolveAliasToAccountPk, signum.account]
  );
  const { data: resolvedPublicKey } = useSWR(['resolveAlias', toValue], addressResolver, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const toFilled = toFilledWithAlias || toFilledWithAddress;

  const toResolved = useMemo(() => {
    try {
      if (resolvedPublicKey && resolvedPublicKey !== SMART_CONTRACT_PUBLIC_KEY) {
        return Address.create(resolvedPublicKey).getNumericId();
      }
      return Address.create(toValue).getNumericId();
    } catch (e) {
      return '';
    }
  }, [resolvedPublicKey, toValue]);

  const filledContact = useMemo(() => {
    if (!resolvedPublicKey) return null;
    const accId = Address.fromPublicKey(resolvedPublicKey).getNumericId();
    return allContacts.find(c => c.accountId === accId);
  }, [allContacts, resolvedPublicKey]);

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  useLayoutEffect(() => {
    if (toFilled) {
      toFieldRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [toFilled]);

  useLayoutEffect(() => {
    if (!toFilled) return;

    return registerBackHandler(() => {
      cleanToField();
      window.scrollTo(0, 0);
    });
  }, [toFilled, registerBackHandler, cleanToField]);

  const maxAmount = useMemo(() => {
    if (!feeValue) return;

    const feeAmount = ChainValue.create(8).setCompound(isSignaToken ? feeValue : 0);

    return balanceData
      ? ChainValue.create(assetDecimals).setCompound(balanceData.availableBalance.toString(10)).subtract(feeAmount)
      : ChainValue.create(assetDecimals).setCompound(0);
  }, [feeValue, isSignaToken, balanceData, assetDecimals]);

  const totalAmount = useMemo(() => {
    if (!amountValue) return;
    const feeAmount = ChainValue.create(8).setCompound(isSignaToken ? feeValue || MinimumFee : 0);
    return ChainValue.create(assetDecimals).setCompound(amountValue).add(feeAmount);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [isSignaToken, amountValue, feeValue, messageFormData.message, assetDecimals]); // keep messageFromData.message

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');
      if (v < 0) return t('amountMustBePositive');
      if (!maxAmount) return true;
      try {
        return ChainValue.create(assetMetadata.decimals).setCompound(v).lessOrEqual(maxAmount)
          ? true
          : t('maximalAmount', toLocalFixed(maxAmount.getCompound()));
      } catch (e) {
        return t('error'); // WHAT MESSAGE?
      }
    },
    [maxAmount, assetMetadata.decimals]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.has('amount')) {
      triggerValidation('amount');
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountStr]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.getCompound());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleAmountFieldFocus = useCallback(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const [submitError, setSubmitError] = useSafeState<any>(null);

  const validateRecipient = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }
      let address = value;
      if (!isSignumAddress(address)) {
        address = await resolveAliasToAccountPk(address);
      }
      return isSignumAddress(address) ? true : t('invalidAddressOrDomain');
    },
    [resolveAliasToAccountPk]
  );

  const getTransactionAttachment = useCallback(
    async (p2pKey: string) => {
      if (!(messageFormData && messageFormData.isValid)) {
        return undefined;
      }

      if (messageFormData.isEncrypted) {
        if (!resolvedPublicKey) {
          throw new Error(t('p2pNotPossible'));
        }

        const encryptedMessage = encryptMessage(messageFormData.message, resolvedPublicKey, p2pKey);
        return new AttachmentEncryptedMessage({
          ...encryptedMessage,
          isText: !messageFormData.isBinary
        });
      }
      return new AttachmentMessage({
        messageIsText: !messageFormData.isBinary,
        message: messageFormData.message
      });
    },
    [messageFormData]
  );

  const onSubmit = useCallback(
    async ({ amount }: FormData) => {
      if (!assetMetadata) return;
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);
      try {
        const keys = await client.getSignumTransactionKeys(acc.publicKey);
        const attachment = await getTransactionAttachment(keys.p2pKey);
        const recipientId = Address.create(toResolved).getNumericId();

        let txId: TransactionId;
        if (!assetMetadata.id || assetMetadata.id === SIGNA_TOKEN_ID) {
          txId = (await signum.transaction.sendAmountToSingleRecipient({
            amountPlanck: Amount.fromSigna(amount).getPlanck(),
            feePlanck: Amount.fromSigna(feeValue).getPlanck(),
            recipientId,
            senderPrivateKey: keys.signingKey,
            senderPublicKey: keys.publicKey,
            attachment
          })) as TransactionId;
        } else {
          txId = (await signum.asset.transferAsset({
            assetId: assetMetadata.id,
            quantity: ChainValue.create(assetDecimals).setCompound(amount).getAtomic(),
            feePlanck: Amount.fromSigna(feeValue).getPlanck(),
            recipientId,
            senderPrivateKey: keys.signingKey,
            senderPublicKey: keys.publicKey,
            attachment
          })) as TransactionId;
        }

        setOperation({
          txId: txId.transaction,
          hash: txId.fullHash
        });
        reset({ to: '', amount: '0' });
        // @ts-ignore
        messageFormRef.current.reset();
        formAnalytics.trackSubmitSuccess();
      } catch (err) {
        formAnalytics.trackSubmitFail();
        if (err.message === 'Declined') {
          return;
        }
        await withErrorHumanDelay(err, () => {
          setSubmitError(err);
        });
      }
    },
    [
      client,
      signum.transaction,
      acc,
      formState.isSubmitting,
      setSubmitError,
      setOperation,
      reset,
      messageFormRef,
      toResolved,
      formAnalytics,
      feeValue,
      getTransactionAttachment
    ]
  );

  const handleAccountSelect = useCallback(
    (recipient: string) => {
      setValue('to', recipient);
      triggerValidation('to');
    },
    [setValue, triggerValidation]
  );

  const restFormDisplayed = Boolean(toFilled) && Boolean(amountValue);

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
  }, [setToFieldFocused]);

  const allContactsWithoutCurrent = useMemo(() => {
    const accId = Address.fromPublicKey(publicKey).getNumericId();
    return allContacts.filter(c => c.accountId !== accId);
  }, [allContacts, publicKey]);

  const feeFactor = messageFormData.message ? Math.ceil(messageFormData.message.length / 176) : 1;

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={
          <NoSpaceField
            ref={toFieldRef}
            onFocus={handleToFieldFocus}
            dropdownInner={
              allContactsWithoutCurrent.length > 0 && (
                <ContactsDropdown
                  contacts={allContactsWithoutCurrent}
                  opened={!toFilled ? toFieldFocused : false}
                  onSelect={handleAccountSelect}
                  searchTerm={toValue}
                />
              )
            }
          />
        }
        control={control}
        rules={{
          validate: validateRecipient
        }}
        onChange={([v]) => v}
        onBlur={handleToFieldBlur}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t('recipient')}
        labelDescription={
          filledContact ? (
            <FilledContact contact={filledContact} metadata={assetMetadata} />
          ) : (
            <T id="tokensRecepientInputDescriptionWithDomain" substitutions={assetSymbol} />
          )
        }
        placeholder={t('recipientInputPlaceholderWithDomain')}
        errorCaption={!toFieldFocused ? errors.to?.message : null}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4 mt-3"
      />

      {toResolved && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-no-wrap">{t('resolvedAddress')}:</span>

          {resolvedPublicKey === SMART_CONTRACT_PUBLIC_KEY && (
            <span className="font-normal">🤖 {Address.create(toResolved, prefix).getReedSolomonAddress()}</span>
          )}

          {toResolved === BURN_ADDRESS && <span className="font-normal">🔥 {t('burnAddress')}</span>}

          {resolvedPublicKey !== SMART_CONTRACT_PUBLIC_KEY && toResolved !== BURN_ADDRESS && (
            <span className="font-normal">{Address.create(toResolved, prefix).getReedSolomonAddress()}</span>
          )}
        </div>
      )}

      {toFilled && !filledContact && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <button
            type="button"
            className="text-xs font-light text-gray-600 underline"
            onClick={() => onAddContactRequested(toResolved)}
          >
            <T id="addThisAddressToContacts" />
          </button>
        </div>
      )}

      <Controller
        name="amount"
        as={<AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} />}
        control={control}
        rules={{
          validate: validateAmount
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="send-amount"
        assetSymbol={assetSymbol}
        assetDecimals={assetMetadata?.decimals ?? 0}
        label={t('amount')}
        labelDescription={
          restFormDisplayed &&
          maxAmount && (
            <>
              <T id="availableToSend" />{' '}
              <button type="button" className={classNames('underline')}>
                <span className={classNames('text-xs leading-none')}>
                  <Money onClick={handleSetMaxAmount}>{maxAmount.getCompound()}</Money>{' '}
                  <span style={{ fontSize: '0.75em' }}>{assetSymbol}</span>
                </span>
              </button>
            </>
          )
        }
        placeholder={t('amountPlaceholder')}
        errorCaption={restFormDisplayed && errors.amount?.message}
        autoFocus={Boolean(maxAmount)}
      />

      <MessageForm
        ref={messageFormRef}
        onChange={setMessageFormData}
        showEncrypted={resolvedPublicKey ? resolvedPublicKey !== SMART_CONTRACT_PUBLIC_KEY : false}
        mode="transfer"
      />

      {restFormDisplayed ? (
        <>
          {(() => {
            if (Boolean(submitError)) {
              return <SendErrorAlert type="submit" error={submitError} />;
            } else if (toResolved === accountId) {
              return (
                <Alert
                  type="warn"
                  title={t('attentionExclamation')}
                  description={<T id="tryingToTransferToYourself" />}
                  className="mt-6 mb-4"
                />
              );
            }
            return null;
          })()}

          <FeeInput onChange={setFeeValue} factor={feeFactor} />

          {totalAmount && (
            <div className={'flex flex-row items-center justify-start text-gray-600 mb-4 text-lg font-bold'}>
              <T id="totalAmount" />
              {': '}
              <span className={'leading-none ml-1'}>
                <Money>{totalAmount.getCompound()}</Money>
                {assetSymbol}
              </span>

              {!isSignaToken && (
                <span className={'text-sm font-normal leading-none ml-1'}>
                  +<Money>{Amount.fromSigna(feeValue).getSigna()}</Money>
                  {signaSymbol}
                </span>
              )}
            </div>
          )}

          {totalAmount && errors.amount === undefined && messageFormData.isValid && (
            <div className={'flex flex-row items-center justify-center'}>
              {toResolved === BURN_ADDRESS ? (
                <T id="burn">
                  {message => (
                    <FormSubmitButton loading={formState.isSubmitting} danger>
                      {message}
                    </FormSubmitButton>
                  )}
                </T>
              ) : (
                <T id="send">
                  {message => <FormSubmitButton loading={formState.isSubmitting}>{message}</FormSubmitButton>}
                </T>
              )}
            </div>
          )}
        </>
      ) : null}
    </form>
  );
};
