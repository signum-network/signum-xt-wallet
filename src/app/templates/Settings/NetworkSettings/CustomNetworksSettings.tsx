import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormCheckbox from 'app/atoms/FormCheckbox';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import SubTitle from 'app/atoms/SubTitle';
import { HTTP_URL_PATTERN } from 'app/defaults';
import { T, t } from 'lib/i18n/react';
import { canConnectToNetwork, NetworkName, useSettings, useTempleClient } from 'lib/temple/front';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

import { NetworksListItem } from './NetworksListItem';

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
  isTestnet: boolean;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

function getRandomInt(min: number, max: number) {
  // min inclusive, max exclusive!
  return Math.floor(Math.random() * (max - min) + min);
}

// TODO: When multiverse is active in practice we should give the option for adding network names also.
// At this moment, we support only Signum and Signum-TESTNET
const CustomNetworksSettings: FC = () => {
  const { updateSettings, defaultNetworks } = useTempleClient();
  const { customNetworks = [] } = useSettings();
  const confirm = useConfirm();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<NetworkFormData>({
    defaultValues: {
      isTestnet: false
    }
  });
  const submitting = formState.isSubmitting;

  const onNetworkFormSubmit = useCallback(
    async ({ rpcBaseURL, name, isTestnet }: NetworkFormData) => {
      if (submitting) return;
      clearError();
      const type = isTestnet ? 'test' : 'main';
      const canConnect = await canConnectToNetwork(rpcBaseURL);
      if (!canConnect) {
        await withErrorHumanDelay(`cannot connect to ${rpcBaseURL}`, () =>
          setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('cantConnectToNetwork'))
        );
        return;
      }
      try {
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              rpcBaseURL,
              name,
              networkName: isTestnet ? NetworkName.Testnet : NetworkName.Mainnet,
              description: name,
              type,
              disabled: false,
              color: COLORS[getRandomInt(74, COLORS.length)], // something violet or pink
              id: rpcBaseURL
            }
          ]
        });
        resetForm();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message));
      }
    },
    [clearError, customNetworks, resetForm, submitting, setError, updateSettings]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) =>
      ![...defaultNetworks, ...customNetworks].filter(n => !n.hidden).some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customNetworks, defaultNetworks]
  );

  const handleRemoveClick = useCallback(
    async (baseUrl: string) => {
      if (
        !(await confirm({
          title: t('actionConfirmation'),
          children: t('deleteNetworkConfirm')
        }))
      ) {
        return;
      }

      updateSettings({
        customNetworks: customNetworks.filter(({ rpcBaseURL }) => rpcBaseURL !== baseUrl)
      }).catch(async err => {
        console.error(err);
        await withErrorHumanDelay(err, () => setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message));
      });
    },
    [customNetworks, setError, updateSettings, confirm]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
          <span className="text-base font-semibold text-gray-700">{t('currentNetworks')}</span>
          <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
            {t('deleteNetworkHint')}
          </span>
        </h2>

        <div
          className={classNames(
            'rounded-md overflow-hidden',
            'border',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {customNetworks.map(network => (
            <NetworksListItem
              canRemove
              network={network}
              last={false}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
          {defaultNetworks
            .filter(n => !n.hidden)
            .map((network, index) => (
              <NetworksListItem
                canRemove={false}
                key={network.rpcBaseURL}
                last={index === defaultNetworks.length - 1}
                network={network}
              />
            ))}
        </div>
      </div>

      <SubTitle>
        <T id="addNetwork" />
      </SubTitle>

      <form onSubmit={handleSubmit(onNetworkFormSubmit)}>
        <FormField
          ref={register({ required: t('required'), maxLength: 35 })}
          label={t('name')}
          id="name"
          name="name"
          placeholder={t('networkNamePlaceholder')}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={register({
            required: t('required'),
            pattern: {
              value: HTTP_URL_PATTERN,
              message: t('mustBeValidURL')
            },
            validate: {
              unique: rpcURLIsUnique
            }
          })}
          label={t('rpcBaseURL')}
          id="rpc-base-url"
          name="rpcBaseURL"
          placeholder="http://localhost:8125"
          errorCaption={errors.rpcBaseURL?.message || (errors.rpcBaseURL?.type === 'unique' ? t('mustBeUnique') : '')}
          containerClassName="mb-4"
        />
        <FormCheckbox
          ref={register()}
          errorCaption={errors.isTestnet?.message}
          name="isTestnet"
          label={t('networkIsTestnetLabel')}
          labelDescription={<T id="networkIsTestnetDescription" />}
          containerClassName="mb-6"
        />

        <T id="addNetwork">{message => <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>}</T>
      </form>
    </div>
  );
};

export default CustomNetworksSettings;
