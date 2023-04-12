import React, { FC, useCallback, useEffect, useState } from 'react';

import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';
import { QRCode } from 'react-qr-svg';

import Alert from 'app/atoms/Alert';
import FormCheckbox from 'app/atoms/FormCheckbox';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { t } from 'lib/i18n/react';
import { useAccount, useTempleClient } from 'lib/temple/front';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

const HexPattern = /^[0-9a-fA-F]+$/;
const PrivkeyDefaultMessage = t('enterSecretToReveal');

type FormData = {
  password: string;
  isEncoded: boolean;
};
const NostrAccount: FC = () => {
  const account = useAccount();
  const { revealNostrPrivateKey } = useTempleClient();
  const [privateKey, setPrivateKey] = useState<string>(PrivkeyDefaultMessage);
  const hasNostr = account.publicKeyNostr;
  const [publicKey, setPublicKey] = useState<string>(account.publicKeyNostr || '');
  const { register, watch, setValue, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>({
    defaultValues: {
      isEncoded: true
    }
  });

  useEffect(() => {
    if (!account) return;

    setPrivateKey(PrivkeyDefaultMessage);
    setValue('password', '');
    setPublicKey(account.publicKeyNostr || '');
  }, [account]);

  const isEncoded = watch('isEncoded');
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(
    async ({ password }) => {
      if (submitting) return;
      clearError('password');
      try {
        const nostrPrivateKey = await revealNostrPrivateKey(account.publicKey, password);
        setPrivateKey(nostrPrivateKey);
      } catch (err: any) {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError('password', 'submit-error', err.message);
        });
      }
    },
    [submitting, clearError, revealNostrPrivateKey, account.publicKey, setError]
  );

  useEffect(() => {
    try {
      if (isEncoded) {
        if (HexPattern.test(publicKey)) {
          setPublicKey(nip19.npubEncode(publicKey));
        }
        if (HexPattern.test(privateKey)) {
          setPrivateKey(nip19.nsecEncode(privateKey));
        }
      } else {
        if (publicKey.startsWith('npub')) {
          const decoded = nip19.decode(publicKey);
          // @ts-ignore
          setPublicKey(decoded.data);
        }
        if (privateKey.startsWith('nsec')) {
          const decoded = nip19.decode(privateKey);
          // @ts-ignore
          setPrivateKey(decoded.data);
        }
      }
    } catch (e: any) {
      console.error('Coding error', e.message);
    }
  }, [isEncoded, privateKey, publicKey]);

  if (!hasNostr) {
    return (
      <div className="flex flex-col items-center my-8">
        <Alert type="warn" title={t('noNostrAccount')} description={t('noNostrAccountDescription', account.name)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-8">
      <FormCheckbox
        ref={register()}
        name="isEncoded"
        label={t('encodeNostrKeys')}
        labelDescription={t('nostrKeysEncodedDescription')}
        containerClassName="mb-4"
        checked={isEncoded}
        disabled={!hasNostr}
      />

      <div className="flex flex-row items-end justify-between w-full mb-4">
        <FormField
          textarea
          rows={2}
          readOnly
          label={t('nostrPublicKeyLabel')}
          labelDescription={t('nostrPublicKeyDescription')}
          id="nostr-pubkey"
          spellCheck={false}
          className="resize-none notranslate text-md font-mono"
          value={publicKey}
          disabled={!hasNostr}
        />
        <div className="ml-1 mb-2 p-1 bg-gray-100 border-2 border-gray-300 rounded-lg" style={{ maxWidth: '72px' }}>
          <QRCode
            bgColor="#f7fafc"
            fgColor="#000000"
            level="Q"
            style={{
              width: '100%',
              filter: !publicKey ? 'blur(4px)' : '',
              opacity: !publicKey ? '0.5' : '1.0'
            }}
            value={publicKey}
          />
        </div>
      </div>

      <div className="flex flex-row items-end justify-between w-full mb-4">
        <FormField
          secret
          textarea
          rows={2}
          readOnly
          label={t('nostrPrivateKeyLabel')}
          labelDescription={t('nostrPrivateKeyDescription')}
          id="nostr-privkey"
          spellCheck={false}
          className="resize-none notranslate"
          value={privateKey}
          errorCaption={errors.password?.message}
          disabled={!hasNostr}
        />
        <div className={`ml-1 mb-2 p-1 bg-gray-100 border-2 border-gray-300 rounded-lg`} style={{ maxWidth: '72px' }}>
          <QRCode
            bgColor="#f7fafc"
            fgColor="#000000"
            level="Q"
            style={{
              width: '100%',
              filter: privateKey === PrivkeyDefaultMessage ? 'blur(4px)' : '',
              opacity: privateKey === PrivkeyDefaultMessage ? '0.5' : '1.0'
            }}
            value={privateKey}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-row items-end w-full">
        <FormField
          ref={register({ required: t('required') })}
          label={t('password')}
          labelDescription={t('enterPasswordToRevealKey')}
          id="reveal-nostrkey-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          disabled={!hasNostr}
        />
        <div className="mb-2 ml-2 h-[53px]">
          <FormSubmitButton loading={submitting} disabled={submitting || !hasNostr}>
            {t('reveal')}
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
};

export default NostrAccount;
