import React, { useCallback } from 'react';

import { Address } from '@signumjs/core';
import { useForm } from 'react-hook-form';

import { T, t } from '../../../lib/i18n/react';
import { useContacts, useSignumAliasResolver, isSignumAddress } from '../../../lib/temple/front';
import { withErrorHumanDelay } from '../../../lib/ui/humanDelay';
import FormField from '../../atoms/FormField';
import FormSubmitButton from '../../atoms/FormSubmitButton';
import { ContactFormData } from './ContactFormData';

const SUBMIT_ERROR_TYPE = 'submit-error';

const AddNewContactForm: React.FC<{ className?: string }> = ({ className }) => {
  const { addContact } = useContacts();
  const { resolveAliasToAccountId } = useSignumAliasResolver();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<ContactFormData>();
  const submitting = formState.isSubmitting;

  const resolveAlias = useCallback(
    async (address: string) => {
      if (!isSignumAddress(address)) {
        const accountId = await resolveAliasToAccountId(address);
        if (!accountId) {
          throw new Error(t('domainDoesntResolveToAddress', address));
        }
        return accountId;
      } else {
        return address;
      }
    },
    [resolveAliasToAccountId]
  );

  const onAddContactSubmit = useCallback(
    async ({ address, name }: ContactFormData) => {
      if (submitting) return;

      try {
        clearError();
        address = await resolveAlias(address);
        if (!isSignumAddress(address)) {
          throw new Error(t('invalidAddressOrDomain'));
        }
        await addContact({ address: Address.create(address).getNumericId(), name, addedAt: Date.now() });
        resetForm();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('address', SUBMIT_ERROR_TYPE, err.message));
      }
    },
    [submitting, clearError, addContact, resetForm, setError, resolveAlias]
  );

  const validateAddressField = useCallback(
    async (value: any) => {
      if (!value?.length) {
        return t('Required');
      }
      try {
        value = await resolveAlias(value);
        return isSignumAddress(value) ? true : t('invalidAddressOrDomain');
      } catch (e) {
        return t('invalidAddressOrDomain');
      }
    },
    [resolveAlias]
  );

  return (
    <form className={className} onSubmit={handleSubmit(onAddContactSubmit)}>
      <FormField
        ref={register({ validate: validateAddressField })}
        label={t('address')}
        id="address"
        name="address"
        placeholder={t('recipientInputPlaceholderWithDomain')}
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          required: t('required'),
          maxLength: { value: 50, message: t('maximalAmount', '50') }
        })}
        label={t('name')}
        id="name"
        name="name"
        placeholder={t('newContactPlaceholder')}
        errorCaption={errors.name?.message}
        containerClassName="mb-6"
        maxLength={50}
      />

      <FormSubmitButton loading={submitting}>
        <T id="addContact" />
      </FormSubmitButton>
    </form>
  );
};

export default AddNewContactForm;
