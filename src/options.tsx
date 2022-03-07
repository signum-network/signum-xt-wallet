import './main.css';

import React, { FC, Suspense, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import * as ReactDOM from 'react-dom';
import browser from 'webextension-polyfill';

import DisableOutlinesForClick from 'app/a11y/DisableOutlinesForClick';
import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import Alert from 'app/atoms/Alert';
import ErrorBoundary from 'app/ErrorBoundary';
import Dialogs from 'app/layouts/Dialogs';
import { getMessage, initializeI18n } from 'lib/i18n';
import { t, T } from 'lib/i18n/react';
import { clearStorage } from 'lib/temple/reset';
import { AlertFn, ConfirmFn, DialogsProvider, useAlert, useConfirm } from 'lib/ui/dialog';

const OptionsWrapper: FC = () => (
  <ErrorBoundary whileMessage="opening options" className="min-h-screen">
    <DialogsProvider>
      <Suspense fallback={<RootSuspenseFallback />}>
        <Dialogs />
        <DisableOutlinesForClick />
        <Options />
      </Suspense>
    </DialogsProvider>
  </ErrorBoundary>
);

type QueryType = {
  [key: string]: string;
};

function parseLocationSearch(): QueryType {
  const params = window.location.search.substr(1).split('&');
  return params.reduce((q, param) => {
    const [k, v] = param.split('=');
    q[k] = v;
    return q;
  }, {} as QueryType);
}

const Options: FC = () => {
  const alert = useAlert();
  const confirm = useConfirm();
  const [, setI18nInitialized] = useState(false);
  const [query, setQuery] = useState<QueryType>({});

  useEffect(() => {
    // forces a re-render after i18n file was loaded
    initializeI18n(() => {
      setI18nInitialized(true);
    });
    setQuery(parseLocationSearch());
  }, []);

  const internalHandleReset = useCallback(() => {
    handleReset(alert, confirm);
  }, [alert, confirm]);

  return (
    <div className="p-4">
      <h1 className="mb-2 text-xl font-semibold">{t('templeWalletOptions')}</h1>

      <div className="mx-auto my-8">
        {query.reset === 'true' && (
          <Alert
            type="warn"
            title={t('optionsPageWarningResetRequiredTitle')}
            description={
              <T id={'optionsPageWarningResetRequiredDescription'} substitutions={[query.updateFromVersion]} />
            }
            autoFocus
          />
        )}
      </div>

      <div className="my-6">
        <button
          className={classNames(
            'relative',
            'px-2 py-1',
            'bg-primary-orange rounded',
            'border-2 border-primary-orange',
            'flex items-center',
            'text-primary-orange-lighter',
            'text-sm font-semibold',
            'transition duration-200 ease-in-out',
            'opacity-90 hover:opacity-100 focus:opacity-100',
            'shadow-sm hover:shadow focus:shadow'
          )}
          onClick={internalHandleReset}
        >
          {getMessage('resetExtension')}
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<OptionsWrapper />, document.getElementById('root'));

let resetting = false;

async function handleReset(alert: AlertFn, confirm: ConfirmFn) {
  if (resetting) return;
  resetting = true;

  const confirmed = await confirm({
    title: getMessage('actionConfirmation'),
    children: <T id="resetExtensionConfirmation" />
  });
  if (confirmed) {
    (async () => {
      try {
        await clearStorage();
        browser.runtime.reload();
      } catch (err: any) {
        await alert({
          title: getMessage('error'),
          children: err.message
        });
      }
    })();
  }

  resetting = false;
}
