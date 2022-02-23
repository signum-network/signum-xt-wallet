import React, { FC, ReactNode, useCallback, useState } from 'react';

import { useForm } from 'react-hook-form';

import { T, t } from '../../../lib/i18n/react';
import { useTempleClient } from '../../../lib/temple/front';
import { withErrorHumanDelay } from '../../../lib/ui/humanDelay';
import Alert from '../../atoms/Alert';
import FormField from '../../atoms/FormField';
import FormSubmitButton from '../../atoms/FormSubmitButton';
import { formatMnemonic } from '../../defaults';

interface ByMnemonicFormData {
  mnemonic: string;
}

export const ByMnemonicForm: FC = () => {
  const { importMnemonicAccount } = useTempleClient();
  const { register, handleSubmit, errors, formState } = useForm<ByMnemonicFormData>();
  const [error, setError] = useState<ReactNode>(null);

  const onSubmit = useCallback(
    async ({ mnemonic }: ByMnemonicFormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importMnemonicAccount(formatMnemonic(mnemonic));
      } catch (err: any) {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError(err.message);
        });
      }
    },
    [formState.isSubmitting, setError, importMnemonicAccount]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <FormField
        secret
        textarea
        rows={4}
        name="mnemonic"
        ref={register({
          required: t('required')
        })}
        errorCaption={errors.mnemonic?.message}
        label={t('mnemonicInputLabel')}
        labelDescription={t('mnemonicInputDescription')}
        labelWarning={t('mnemonicInputWarning')}
        id="importfundacc-mnemonic"
        placeholder={t('mnemonicInputPlaceholder')}
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none"
      />

      <T id="importAccount">
        {message => (
          <FormSubmitButton loading={formState.isSubmitting} className="mt-8">
            {message}
          </FormSubmitButton>
        )}
      </T>
    </form>
  );
};
