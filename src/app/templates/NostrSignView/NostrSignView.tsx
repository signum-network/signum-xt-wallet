import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import { TempleNostrSignPayload } from 'lib/temple/front';

import Alert from '../../atoms/Alert';
import JsonView from '../JsonView';

interface Props {
  payload: TempleNostrSignPayload;
}

const NostrSignView: FC<Props> = ({ payload }) => {
  const SigningViewFormats = [
    {
      key: 'preview',
      name: t('preview'),
      Icon: EyeIcon
    },
    {
      key: 'raw',
      name: t('raw'),
      Icon: CodeAltIcon
    }
  ];

  const [signViewFormat, setSignViewFormat] = useState(SigningViewFormats[0]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!payload) return;

    // parseNostrEvent(payload.event)
  }, [payload]);

  const handleErrorAlertClose = useCallback(() => setError(''), [setError]);

  if (error) {
    return (
      <Alert
        closable
        onClose={handleErrorAlertClose}
        type="error"
        title="Error"
        description={error}
        className="my-4"
        autoFocus
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="mb-3 leading-tight flex items-center">
        <T id="payloadToSign">
          {message => <span className="mr-2 text-base font-semibold text-gray-700">{message}</span>}
        </T>

        <div className="flex-1" />

        <ViewsSwitcher activeItem={signViewFormat} items={SigningViewFormats} onChange={setSignViewFormat} />
      </h2>

      <JsonView
        jsonObject={payload.event}
        className={classNames(signViewFormat.key !== 'raw' && 'hidden')}
        jsonViewStyle={{ maxHeight: '100%', overflow: 'auto' }}
      />

      <div className={classNames(signViewFormat.key !== 'preview' && 'hidden')}>
        <h2>To Do</h2>
      </div>
    </div>
  );
};

export default NostrSignView;
