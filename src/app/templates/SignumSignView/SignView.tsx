import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import { TempleDAppSignPayload, useSignum } from 'lib/temple/front';
import { parseSignumTransaction, ParsedTransaction } from 'lib/temple/front/parseSignumTransaction';

import { withErrorHumanDelay } from '../../../lib/ui/humanDelay';
import Alert from '../../atoms/Alert';
import JsonView from './JsonView';
import TransactionView from './TransactionView';

type OperationViewProps = {
  payload: TempleDAppSignPayload;
};

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

const SignView: FC<OperationViewProps> = ({ payload }) => {
  const signum = useSignum();
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null);
  const [jsonTransaction, setJsonTransaction] = useState<object>({});
  const [signViewFormat, setSignViewFormat] = useState(SigningViewFormats[0]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!payload) return;
    parseSignumTransaction(payload.preview, payload.sourcePkh, signum)
      .then(([txParsed, txJson]) => {
        setParsedTransaction(txParsed);
        setJsonTransaction(txJson);
      })
      .catch(async err => {
        console.error(err);
        await withErrorHumanDelay(err, () => {
          setError(t('failedToParseTransactionData'));
        });
      });
  }, [payload, signum]);

  const handleErrorAlertClose = useCallback(() => setError(''), [setError]);

  if (!parsedTransaction) return null;

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
        jsonObject={jsonTransaction}
        className={classNames(signViewFormat.key !== 'raw' && 'hidden')}
        jsonViewStyle={{ height: '11rem', maxHeight: '100%', overflow: 'auto' }}
      />

      <div className={classNames(signViewFormat.key !== 'preview' && 'hidden')}>
        <TransactionView transaction={parsedTransaction} />
      </div>
    </div>
  );
};

export default SignView;
