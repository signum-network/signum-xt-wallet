import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import AutoConfirmationSelect from 'app/templates/NostrSignView/AutoConfirmationSelect';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import { shortenString } from 'lib/shortenString';
import { TempleNostrSignPayload } from 'lib/temple/front';
import { ParsedNostrEvent, parseNostrEvent } from 'lib/temple/front/parseNostrEvent';

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
  const [parsedEvent, setParsedEvent] = useState<ParsedNostrEvent | null>(null);
  useEffect(() => {
    if (payload && payload.event) {
      setParsedEvent(parseNostrEvent(payload.event));
    }
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

  if (!parsedEvent) return null;

  return (
    <div className="flex flex-col w-full">
      <div className="mb-3">
        <AutoConfirmationSelect />
      </div>

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
        <div className="flex flex-row items-center">
          <Identicon hash={parsedEvent.kindName} size={24} />
          <h2 className="ml-2 font-bold text-gray-600">{`${parsedEvent.kind} - ${parsedEvent.kindName}`}</h2>
        </div>
        <div className={'overflow-y-auto'} style={{ height: '110px' }}>
          {parsedEvent.content && (
            <pre className="p-1 my-1 border rounded text-gray-600 whitespace-normal break-all">
              {shortenString(parsedEvent.content, 92)}
            </pre>
          )}
          {parsedEvent.tags.map((t, i) => (
            <TagLine key={`tagline-${i}`} tag={t} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NostrSignView;

interface TagLineProps {
  tag: string[];
}

function getValue(type: string, entry: string, position: number) {
  // relay urls are bigger
  if (position === 1 && (type === 'a' || type === 'e' || type === 'p')) {
    return shortenString(entry, 48);
  }

  if (position === 0 && (type === 'relay' || type === 'r')) {
    return shortenString(entry, 48);
  }

  return shortenString(entry);
}
const TagLine = ({ tag }: TagLineProps) => {
  const [head, ...tail] = tag;

  return (
    <span className="flex flex-row flex-wrap justify-start items-center text-xs my-1">
      <div className="px-1 mr-2 font-bold bg-gray-400 text-gray-700 border rounded uppercase">{head}</div>
      {tail.map((entry, i) => {
        return (
          <div key={`${head}-${i}`} className="px-1 text-xs text-gray-600 border rounded" style={{ margin: '2px 2px' }}>
            {getValue(head, entry, i)}
          </div>
        );
      })}
    </span>
  );
};
