import React, { FC, ReactNode, useCallback, useLayoutEffect, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormCheckbox from 'app/atoms/FormCheckbox';
import FormField, { PASSWORD_ERROR_CAPTION } from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { formatMnemonic, PASSWORD_PATTERN } from 'app/defaults';
import { generateSignumMnemonic } from 'lib/generateSignumMnemonic';
import { T, t } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';
import { useAlert } from 'lib/ui/dialog';
import { PasswordValidation } from 'lib/ui/PasswordStrengthIndicator';
import { Link } from 'lib/woozie';

import BackupMnemonic from './BackupMnemonic';
import VerifyMnemonic from './VerifyMnemonic';

interface FormData {
  mnemonic?: string;
  password?: string;
  repassword?: string;
  termsaccepted: boolean;
}

interface BackupData {
  mnemonic: string;
  password: string;
}

type NewWalletProps = {
  ownMnemonic?: boolean;
  title: string;
  tabSlug?: string;
};

const NewWallet: FC<NewWalletProps> = ({ ownMnemonic = false, title }) => {
  const { locked, registerWallet } = useTempleClient();
  const alert = useAlert();

  const { watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;
  const passwordValue = watch('password');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false
  });

  useLayoutEffect(() => {
    if (formState.dirtyFields.has('repassword')) {
      triggerValidation('repassword');
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [verifySeedPhrase, setVerifySeedPhrase] = useState(false);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;

      try {
        if (ownMnemonic) {
          await registerWallet(data.password!, formatMnemonic(data.mnemonic!));
        } else {
          const mnemonic = await generateSignumMnemonic();
          setBackupData({
            mnemonic,
            password: data.password!
          });
        }
      } catch (err: any) {
        console.error(err);

        await alert({
          title: t('actionConfirmation'),
          children: err.message
        });
      }
    },
    [submitting, ownMnemonic, setBackupData, registerWallet, alert]
  );

  const handleBackupComplete = useCallback(() => {
    setVerifySeedPhrase(true);
  }, [setVerifySeedPhrase]);

  if (backupData) {
    return verifySeedPhrase ? (
      <Template title={t('verifySeedPhrase')}>
        <VerifyMnemonic data={backupData} />
      </Template>
    ) : (
      <Template title={t('backupNewSeedPhrase')}>
        <BackupMnemonic
          mnemonic={backupData.mnemonic}
          onBackupComplete={handleBackupComplete}
          buttonLabelId="continue"
        />
      </Template>
    );
  }

  // Initial step (create or import mnemonic)
  return (
    <Template title={title}>
      <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
        {locked && (
          <Alert
            title={t('attentionExclamation')}
            description={
              <>
                <p>
                  <T id="lockedWalletAlreadyExists" />
                </p>

                <p className="mt-1">
                  <T
                    id="unlockWalletPrompt"
                    substitutions={[
                      <T id="backToUnlockPage" key="link">
                        {linkLabel => (
                          <Link to="/" className="font-semibold hover:underline">
                            {linkLabel}
                          </Link>
                        )}
                      </T>
                    ]}
                  />
                </p>
              </>
            }
            className="my-6"
          />
        )}

        {ownMnemonic && (
          <FormField
            secret
            textarea
            rows={4}
            ref={register({
              required: t('required')
            })}
            label={t('mnemonicInputLabel')}
            labelDescription={t('mnemonicInputDescription')}
            id="newwallet-mnemonic"
            name="mnemonic"
            placeholder={t('mnemonicInputPlaceholder')}
            spellCheck={false}
            errorCaption={errors.mnemonic?.message}
            containerClassName="mb-4"
            className="resize-none"
          />
        )}

        <>
          <FormField
            ref={register({
              required: PASSWORD_ERROR_CAPTION,
              pattern: {
                value: PASSWORD_PATTERN,
                message: PASSWORD_ERROR_CAPTION
              }
            })}
            label={t('password')}
            labelDescription={t('unlockPasswordInputDescription')}
            id="newwallet-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-8"
            passwordValidation={passwordValidation}
            setPasswordValidation={setPasswordValidation}
          />

          <FormField
            ref={register({
              required: t('required'),
              validate: val => val === passwordValue || t('mustBeEqualToPasswordAbove')
            })}
            label={t('repeatPassword')}
            labelDescription={t('repeatPasswordInputDescription')}
            id="newwallet-repassword"
            type="password"
            name="repassword"
            placeholder="********"
            errorCaption={errors.repassword?.message}
            containerClassName="mb-8"
          />
        </>

        <FormCheckbox
          ref={register({
            validate: val => val || t('confirmTermsError')
          })}
          errorCaption={errors.termsaccepted?.message}
          name="termsaccepted"
          label={t('acceptTerms')}
          labelDescription={
            <T
              id="acceptTermsInputDescription"
              substitutions={[
                <T id="termsOfUsage" key="termsLink">
                  {message => (
                    <a
                      href="https://www.signum.network/xtterms.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-secondary"
                    >
                      {message}
                    </a>
                  )}
                </T>,
                <T id="privacyPolicy" key="privacyPolicyLink">
                  {message => (
                    <a
                      href="https://signum.network/xtprivacypolicy.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-secondary"
                    >
                      {message}
                    </a>
                  )}
                </T>
              ]}
            />
          }
          containerClassName="mb-8"
        />

        <FormSubmitButton loading={submitting}>
          <T id={ownMnemonic ? 'import' : 'create'} />
        </FormSubmitButton>
      </form>
    </Template>
  );
};

export default NewWallet;

type TemplateProps = {
  title: ReactNode;
};

const Template: FC<TemplateProps> = ({ title, children }) => (
  <div className="py-4">
    <h1 className={classNames('mb-2', 'text-2xl font-light text-gray-700 text-center')}>{title}</h1>
    <hr className="my-4" />
    {children}
  </div>
);
