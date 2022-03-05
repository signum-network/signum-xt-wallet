import React, { FC, useCallback } from 'react';

import { Address } from '@signumjs/core';
import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import HashShortView from 'app/atoms/HashShortView';
import ModalWithTitle from 'app/templates/ModalWithTitle';
import { T, t } from 'lib/i18n/react';
import { useContacts, useSignumAccountPrefix } from 'lib/temple/front';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

import IdenticonSignum from '../../atoms/IdenticonSignum';

type AddContactModalProps = {
  accountId: string | null;
  onClose: () => void;
};

const AddContactModal: FC<AddContactModalProps> = ({ accountId, onClose }) => {
  const { addContact } = useContacts();
  const prefix = useSignumAccountPrefix();
  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<{ name: string }>();
  const submitting = formState.isSubmitting;

  const onAddContactSubmit = useCallback(
    async ({ name }: { name: string }) => {
      if (submitting) return;
      if (!accountId) return;

      try {
        clearError();
        await addContact({
          rsAddress: Address.fromNumericId(accountId, prefix).getReedSolomonAddress(),
          accountId,
          name,
          addedAt: Date.now()
        });
        resetForm();
        onClose();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('name', 'submit-error', err.message));
      }
    },
    [submitting, clearError, addContact, accountId, resetForm, onClose, setError]
  );

  return (
    <ModalWithTitle isOpen={Boolean(accountId)} title={<T id="addNewContact" />} onRequestClose={onClose}>
      <form onSubmit={handleSubmit(onAddContactSubmit)}>
        <div className="mb-8">
          <div className="mb-4 flex items-stretch border rounded-md p-2">
            <IdenticonSignum address={accountId ?? ''} size={32} className="flex-shrink-0 shadow-xs" />

            <div className="ml-3 flex-1 flex items-center">
              <span className={classNames('text-base text-gray-700')}>
                <HashShortView hash={accountId ?? ''} isAccount />
              </span>
            </div>
          </div>

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
        </div>
        <div className="flex justify-end">
          <FormSecondaryButton type="button" small className="mr-3" onClick={onClose}>
            <T id="cancel" />
          </FormSecondaryButton>
          <FormSubmitButton small loading={submitting}>
            <T id="addContact" />
          </FormSubmitButton>
        </div>
      </form>
    </ModalWithTitle>
  );
};

export default AddContactModal;
