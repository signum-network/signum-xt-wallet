import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import { ACCOUNT_NAME_PATTERN } from 'app/defaults';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import PageLayout from 'app/layouts/PageLayout';
import { generateSignumMnemonic } from 'lib/generateSignumMnemonic';
import { T, t } from 'lib/i18n/react';
import { XTAccountType, useTempleClient, useAllAccounts, useSetAccountPkh } from 'lib/temple/front';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';
import { navigate } from 'lib/woozie';

import BackupMnemonic from '../templates/BackupMnemonic';

type FormData = {
  name: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';

const CreateAccount: FC = () => {
  const { importMnemonicAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();
  const [mnemonic, setMnemonic] = useState('');

  const allImportedAccounts = useMemo(
    () => allAccounts.filter(acc => [XTAccountType.Imported].includes(acc.type)),
    [allAccounts]
  );

  const defaultName = useMemo(
    () => t('defaultAccountName', String(allImportedAccounts.length + 1)),
    [allImportedAccounts.length]
  );

  useEffect(() => {
    generateSignumMnemonic().then(setMnemonic);
  }, []);

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const { register, errors, setError, clearError, formState, watch } = useForm<FormData>({
    defaultValues: { name: defaultName }
  });
  const submitting = formState.isSubmitting;
  const accountName = watch('name');

  const onSubmit = async () => {
    if (submitting) return;
    if (!accountName || !mnemonic) return;
    clearError('name');

    try {
      await importMnemonicAccount(mnemonic, accountName);
    } catch (err: any) {
      console.error(err);
      await withErrorHumanDelay(err, () => {
        setError('name', SUBMIT_ERROR_TYPE, err.message);
      });
    }
  };

  if (!mnemonic) return null;

  return (
    <PageLayout
      pageTitle={
        <>
          <AddIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="createAccount" />
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6">
        <FormField
          ref={register({
            pattern: {
              value: ACCOUNT_NAME_PATTERN,
              message: t('accountNameInputTitle')
            }
          })}
          label={t('accountName')}
          labelDescription={t('accountNameInputDescription')}
          id="create-account-name"
          type="text"
          name="name"
          required
          placeholder={defaultName}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
        />
        <BackupMnemonic
          mnemonic={mnemonic}
          onBackupComplete={onSubmit}
          buttonLabelId="createAccount"
          disabled={!accountName}
        />
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
