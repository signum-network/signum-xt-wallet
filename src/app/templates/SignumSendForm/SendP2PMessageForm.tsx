import React, { Dispatch, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Address, TransactionId } from '@signumjs/core';
import { Amount, FeeQuantPlanck } from '@signumjs/util';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Money from 'app/atoms/Money';
import NoSpaceField from 'app/atoms/NoSpaceField';
import { useAppEnv } from 'app/env';
import { MessageForm, MessageFormData } from 'app/templates/SignumSendForm/MessageForm';
import { T, t } from 'lib/i18n/react';
import {
  isSignumAddress,
  SMART_CONTRACT_PUBLIC_KEY,
  useAccount,
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
  fee: string;
}

type FormProps = {
  setOperation: Dispatch<any>;
  onAddContactRequested: (address: string) => void;
};

const MinimumFee = Amount.fromPlanck(FeeQuantPlanck).getSigna();

export const SendP2PMessageForm: FC<FormProps> = ({ setOperation, onAddContactRequested }) => {
  const messageFormRef = useRef();
  const { registerBackHandler } = useAppEnv();
  const assetMetadata = useSignumAssetMetadata();
  const { resolveAliasToAccountPk } = useSignumAliasResolver();
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
  const publicKey = acc.publicKey;
  const accountId = acc.accountId;

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation, reset } = useForm<FormData>({
    mode: 'onChange'
  });

  const toValue = watch('to');
  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isSignumAddress(toValue)), [toValue]);

  const toFilledWithAlias = useMemo(() => toValue && !isSignumAddress(toValue), [toValue]);

  const addressResolver = useCallback(
    async (_k: string, address: string) => {
      try {
        const id = Address.create(address).getNumericId();
        const a = await signum.account.getAccount({
          accountId: id,
          includeEstimatedCommitment: false,
          includeCommittedAmount: false
        });
        // @ts-ignore
        return a.publicKey;
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

  const totalAmount = useMemo(() => {
    return Amount.fromSigna(feeValue || MinimumFee);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [feeValue, messageFormData.message]); // keep messageFromData.message

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

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    if (!(messageFormData && messageFormData.isValid)) {
      return;
    }

    setSubmitError(null);
    setOperation(null);
    let transaction: TransactionId;
    try {
      const keys = await client.getSignumTransactionKeys(acc.publicKey);
      const recipientId = Address.create(toResolved).getNumericId();
      if (messageFormData.isEncrypted) {
        if (!resolvedPublicKey) {
          throw new Error(t('p2pNotPossible'));
        }
        transaction = (await signum.message.sendEncryptedMessage({
          message: messageFormData.message,
          messageIsText: !messageFormData.isBinary,
          senderAgreementKey: keys.p2pKey,
          feePlanck: Amount.fromSigna(feeValue).getPlanck(),
          recipientPublicKey: resolvedPublicKey,
          recipientId: Address.fromPublicKey(resolvedPublicKey).getNumericId(),
          senderPublicKey: keys.publicKey,
          senderPrivateKey: keys.signingKey
        })) as TransactionId;
      } else {
        transaction = (await signum.message.sendMessage({
          message: messageFormData.message,
          messageIsText: !messageFormData.isBinary,
          feePlanck: Amount.fromSigna(feeValue).getPlanck(),
          recipientId,
          senderPublicKey: keys.publicKey,
          senderPrivateKey: keys.signingKey
        })) as TransactionId;
      }
      setOperation({
        txId: transaction.transaction,
        hash: transaction.fullHash
      });
      reset({ to: '' });
      // @ts-ignore
      messageFormRef.current.reset();
    } catch (err) {
      if (err.message === 'Declined') {
        return;
      }
      await withErrorHumanDelay(err, () => {
        setSubmitError(err);
      });
    }
  }, [
    client,
    signum.transaction,
    acc,
    formState.isSubmitting,
    setSubmitError,
    setOperation,
    reset,
    messageFormRef,
    messageFormData,
    toResolved,
    feeValue
  ]);

  const handleAccountSelect = useCallback(
    (recipient: string) => {
      setValue('to', recipient);
      triggerValidation('to');
    },
    [setValue, triggerValidation]
  );

  const restFormDisplayed = Boolean(toFilled);

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
            <FilledContact contact={filledContact} assetSymbol={assetSymbol} />
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
          {resolvedPublicKey === SMART_CONTRACT_PUBLIC_KEY ? (
            <span className="font-normal">🤖 {Address.create(toResolved, prefix).getReedSolomonAddress()}</span>
          ) : (
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

      <MessageForm
        ref={messageFormRef}
        onChange={setMessageFormData}
        showEncrypted={resolvedPublicKey ? resolvedPublicKey !== SMART_CONTRACT_PUBLIC_KEY : false}
        mode="p2pMessage"
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
                <Money>{totalAmount.getSigna()}</Money>
                {assetSymbol}
              </span>
            </div>
          )}

          {totalAmount && messageFormData.isValid && (
            <div className={'flex flex-row items-center justify-center'}>
              <T id="send">
                {message => <FormSubmitButton loading={formState.isSubmitting}>{message}</FormSubmitButton>}
              </T>
            </div>
          )}
        </>
      ) : null}
    </form>
  );
};
