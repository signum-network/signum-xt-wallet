import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import { WS_URL_PATTERN } from 'app/defaults';
import { ReactComponent as ArrowDown } from 'app/icons/arrow-down-circle.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { T, t } from 'lib/i18n/react';
import { useSettings, useTempleClient } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

import FormCheckbox from '../../atoms/FormCheckbox';
import { shortenString } from 'lib/shortenString';

interface NostrRelayFormData {
  wssRelayUrl: string;
  policyRead: boolean;
  policyWrite: boolean;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

async function canConnectToRelay(wssRelayUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wssRelayUrl);
    const timer = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 5_000);
    ws.onopen = function () {
      ws.close();
      clearTimeout(timer);
      resolve(true);
      // Web Socket is connected, send data using send()
    };

    ws.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
  });
}
const NostrRelaysSettings: FC = () => {
  const { updateSettings } = useTempleClient();
  const { nostrRelays = {} } = useSettings();
  const confirm = useConfirm();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<NostrRelayFormData>({
    defaultValues: {
      policyRead: true,
      policyWrite: true
    }
  });
  const submitting = formState.isSubmitting;

  const onRelayFormSubmit = useCallback(
    async ({ wssRelayUrl, policyWrite, policyRead }: NostrRelayFormData) => {
      if (submitting) return;
      clearError();
      const canConnect = await canConnectToRelay(wssRelayUrl);
      if (!canConnect) {
        await withErrorHumanDelay(`cannot connect to nostr relay ${wssRelayUrl}`, () =>
          setError('wssRelayUrl', SUBMIT_ERROR_TYPE, t('nostrRelayNotReachable'))
        );
        return;
      }
      try {
        await updateSettings({
          nostrRelays: {
            ...nostrRelays,
            [wssRelayUrl]: { read: policyRead, write: policyWrite }
          }
        });
        resetForm();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('wssRelayUrl', SUBMIT_ERROR_TYPE, err.message));
      }
    },
    [clearError, nostrRelays, resetForm, submitting, setError, updateSettings]
  );

  const handleRemoveClick = useCallback(
    async (relayUrl: string) => {
      if (
        !(await confirm({
          title: t('actionConfirmation'),
          children: t('deleteNetworkConfirm')
        }))
      ) {
        return;
      }
      delete nostrRelays[relayUrl];

      updateSettings({ nostrRelays }).catch(async err => {
        console.error(err);
        await withErrorHumanDelay(err, () => setError('wssRelayUrl', SUBMIT_ERROR_TYPE, err.message));
      });
    },
    [nostrRelays, setError, updateSettings, confirm]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
          <T id="currentNostrRelays">
            {message => <span className="text-base font-semibold text-gray-700">{message}</span>}
          </T>

          <T id="deleteNetworkHint">
            {message => (
              <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
                {message}
              </span>
            )}
          </T>
        </h2>

        <div
          className={classNames(
            'rounded-md overflow-hidden',
            'border',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {Object.entries(nostrRelays).map(([url, policy]) => (
            <RelayListItem url={url} key={url} policy={policy} onRemoveClick={handleRemoveClick} />
          ))}
        </div>
      </div>

      <SubTitle>
        <T id="addNostrRelay" />
      </SubTitle>

      <form onSubmit={handleSubmit(onRelayFormSubmit)}>
        <FormField
          ref={register({
            required: t('required'),
            pattern: {
              value: WS_URL_PATTERN,
              message: t('mustBeValidURL')
            },
            validate: {
              unique: (url: string) => !nostrRelays[url]
            }
          })}
          label={t('nostrRelayUrl')}
          id="wss-relay-url"
          name="wssRelayUrl"
          placeholder="wss://relay.nostr.network"
          errorCaption={errors.wssRelayUrl?.message || (errors.wssRelayUrl?.type === 'unique' ? t('mustBeUnique') : '')}
          containerClassName="mb-4"
        />
        <FormCheckbox
          ref={register()}
          errorCaption={errors.policyRead?.message}
          name="policyRead"
          label={t('nostrRelayRead')}
          labelDescription={<T id="nostrRelayReadDescription" />}
        />
        <FormCheckbox
          ref={register()}
          errorCaption={errors.policyWrite?.message}
          name="policyWrite"
          label={t('nostrRelayWrite')}
          labelDescription={<T id="nostrRelayWriteDescription" />}
          containerClassName="mb-6"
        />

        <T id="addNostrRelay">{message => <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>}</T>
      </form>
    </div>
  );
};

export default NostrRelaysSettings;

type RelayListItemProps = {
  url: string;
  policy: { write: boolean; read: boolean };
  onRemoveClick: (url: string) => void;
};

const RelayListItem: FC<RelayListItemProps> = props => {
  const isMounted = useRef(false);
  const { url, policy, onRemoveClick } = props;
  const [reachable, setReachable] = useState(false);
  const handleRemoveClick = () => {
    onRemoveClick(url);
  };

  useEffect(() => {
    isMounted.current = true;
    canConnectToRelay(url).then(canConnect => isMounted.current && setReachable(canConnect));
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <div
      className={classNames(
        'block w-full',
        'overflow-hidden',
        'border-b border-gray-200',
        'flex items-center',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none',
        'opacity-90 hover:opacity-100'
      )}
    >
      <div
        className={classNames('ml-2', 'w-3 h-3', 'border border-primary-white', 'rounded-full shadow-xs')}
        style={{ background: reachable ? 'green' : 'yellow' }}
        title={t(reachable ? 'nostrRelayReachable' : 'nostrRelayNotReachable')}
      />
      <ArrowDown
        className={`w-4 h-4 ${policy.read ? 'text-green-600' : 'text-gray-500'} stroke-current stroke-2`}
        title={t('nostrRelayRead')}
      />
      <div style={{ transform: 'rotate(180deg)' }}>
        <ArrowDown
          className={`w-4 h-4 ${policy.write ? 'text-green-600' : 'text-gray-500'} stroke-current stroke-2`}
          title={t('nostrRelayWrite')}
        />
      </div>
      <div className="flex flex-col justify-between flex-1">
        <div className={classNames('text-sm text-gray-700 font-light', 'flex items-center')}>
          <Name className="ml-1 font-normal">{shortenString(url, 32)}</Name>
        </div>
      </div>

      <button
        className={classNames(
          'flex-none p-2',
          'text-gray-500 hover:text-gray-600',
          'transition ease-in-out duration-200'
        )}
        onClick={handleRemoveClick}
      >
        <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
      </button>
    </div>
  );
};
