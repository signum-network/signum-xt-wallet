import React, { useMemo } from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { t, T } from 'lib/i18n/react';
import { useSharedStorage } from 'lib/temple/front';

const NostrAutoConfirmationSettings = () => {
  const [confirmationTimeout, setConfirmationTimeout] =
    useSharedStorage<{ started: number; timeout: number }>('nostr_confirmation_timeout');

  const handleReset = () => {
    setConfirmationTimeout({
      started: 0,
      timeout: 0
    });
  };

  const distance = useMemo(() => {
    if (!confirmationTimeout) {
      return '';
    }

    const { timeout, started } = confirmationTimeout;
    const targetTimeout = (started + timeout) * 1000;
    if (Date.now() > targetTimeout) {
      return ''; // expired
    }
    return formatDistanceToNow(targetTimeout);
  }, [confirmationTimeout]);

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="autoConfirmationTimeoutReset" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          {distance ? (
            <T id="autoConfirmationTimeoutResetDescription" substitutions={[distance]} />
          ) : (
            <T id="autoConfirmationTimeoutExpiredDescription" />
          )}
        </span>
      </label>

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
        {t('revoke')}
      </button>
    </>
  );
};

export default NostrAutoConfirmationSettings;
