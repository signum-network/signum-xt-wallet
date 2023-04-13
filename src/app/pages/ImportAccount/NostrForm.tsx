import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';

import { Address } from '@signumjs/core';
import { generateMasterKeys } from '@signumjs/crypto';
import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { t } from 'lib/i18n/react';
import { isAcceptableNostrPrivKey } from 'lib/nostr';
import { useTempleClient } from 'lib/temple/front';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

interface ByNostrKeyFormData {
  nsecOrHex: string;
}

export const ByNostrKeyForm: FC = () => {
  const { importNostrPrivateKeyAccount } = useTempleClient();
  const { register, watch, handleSubmit, formState } = useForm<ByNostrKeyFormData>();
  const [error, setError] = useState<ReactNode>(null);
  const [address, setAddress] = useState('');
  const nsecOrHexKey = watch('nsecOrHex');

  useEffect(() => {
    setError('');
    if (!nsecOrHexKey) {
      setAddress('');
      return;
    }

    if (!isAcceptableNostrPrivKey(nsecOrHexKey)) {
      setError(t('nostrPrivateKeyInputWarning'));
      return;
    }

    try {
      const nostrHexKey = nsecOrHexKey.startsWith('nsec') ? (nip19.decode(nsecOrHexKey).data as string) : nsecOrHexKey;
      const { publicKey } = generateMasterKeys(nostrHexKey);
      setAddress(Address.fromPublicKey(publicKey).getReedSolomonAddress(false));
    } catch (e: any) {
      setAddress('');
      setError(t('nostrPrivateKeyInputWarning'));
      console.warn('');
    }
  }, [nsecOrHexKey]);

  const onSubmit = useCallback(
    async ({ nsecOrHex }: ByNostrKeyFormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importNostrPrivateKeyAccount(nsecOrHex, undefined);
      } catch (err: any) {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError(err.message);
        });
      }
    },
    [formState.isSubmitting, setError, importNostrPrivateKeyAccount]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}
      <p className="text-sm text-gray-500 text-justify my-2">{t('importAccountNostrPrivKeyDescription')}</p>

      <FormField
        secret
        textarea
        rows={4}
        name="nsecOrHex"
        ref={register({
          required: t('required')
        })}
        label={t('nostrPrivateKeyInputLabel')}
        labelDescription={t('nostrPrivateKeyInputDescription')}
        id="importfundacc-mnemonic"
        placeholder={t('nostrPrivateKeyInputPlaceholder')}
        spellCheck={false}
        className="resize-none"
        errorCaption={error}
      />
      <>
        <span className="text-base font-semibold text-gray-700">{t('address')}:</span>
        <span className="text-base font-semibold text-gray-700">&nbsp;{address}</span>
      </>

      <FormSubmitButton loading={formState.isSubmitting} className="my-4" disabled={!!error}>
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
};
