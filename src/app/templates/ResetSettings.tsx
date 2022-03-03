import React, { useCallback } from 'react';

import classNames from 'clsx';

import { openOptionsInFullPage, useAppEnv } from 'app/env';
import { t, T } from 'lib/i18n/react';

import Alert from '../atoms/Alert';

const PopupSettings = () => {
  const appEnv = useAppEnv();

  const handleReset = useCallback(() => {
    openOptionsInFullPage();
    if (appEnv.popup) {
      window.close();
    }
  }, [appEnv.popup]);

  return (
    <>
      <Alert type="error" title={t('resetExtension')} description={t('resetExtensionConfirmation')}>
        <div className="flex justify-center">
          <T id="confirm">
            {message => (
              <button
                className={classNames(
                  'mb-6',
                  'px-4 py-1',
                  'bg-red-500 rounded',
                  'border border-black border-opacity-5',
                  'flex items-center',
                  'text-white text-shadow-black',
                  'text-sm font-semibold',
                  'transition duration-300 ease-in-out',
                  'opacity-90 hover:opacity-100',
                  'shadow-sm hover:shadow'
                )}
                onClick={handleReset}
              >
                {message}
              </button>
            )}
          </T>
        </div>
      </Alert>
    </>
  );
};

export default PopupSettings;
