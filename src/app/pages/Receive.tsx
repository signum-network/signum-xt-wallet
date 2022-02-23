import React, { FC, useMemo } from 'react';

import { Address } from '@signumjs/core';
import { createDeeplink } from '@signumjs/util';
import classNames from 'clsx';
import { QRCode } from 'react-qr-svg';

import FormField from 'app/atoms/FormField';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { ReactComponent as QRIcon } from 'app/icons/qr.svg';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n/react';
import { useAccount, useSignumAccountPrefix } from 'lib/temple/front';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

const Receive: FC = () => {
  const account = useAccount();
  const prefix = useSignumAccountPrefix();

  const address = useMemo(() => {
    try {
      return Address.fromNumericId(account.publicKeyHash, prefix).getReedSolomonAddress();
    } catch (e) {
      return account.publicKeyHash;
    }
  }, [account, prefix]);

  const deeplink = useMemo(() => {
    return createDeeplink({
      action: 'pay',
      payload: {
        recipient: account.publicKeyHash
      }
    });
  }, [account]);

  const { fieldRef, copy, copied } = useCopyToClipboard();

  return (
    <PageLayout
      pageTitle={
        <>
          <QRIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="receive" />
        </>
      }
    >
      <div className="py-4">
        <div className={classNames('w-full max-w-sm mx-auto')}>
          <FormField
            ref={fieldRef}
            id="receive-address"
            label={t('address')}
            labelDescription={t('accountAddressLabel')}
            value={address}
            size={36}
            spellCheck={false}
            readOnly
            style={{
              resize: 'none'
            }}
          />

          <button
            type="button"
            className={classNames(
              'mx-auto mb-6',
              'py-1 px-2',
              'bg-primary-orange rounded',
              'border border-primary-orange',
              'flex items-center justify-center',
              'text-primary-orange-lighter text-shadow-black-orange',
              'text-sm font-semibold',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100 focus:opacity-100',
              'shadow-sm',
              'hover:shadow focus:shadow'
            )}
            onClick={copy}
          >
            {copied ? (
              <T id="copiedAddress" />
            ) : (
              <>
                <CopyIcon className={classNames('mr-1', 'h-4 w-auto', 'stroke-current stroke-2')} />
                <T id="copyAddressToClipboard" />
              </>
            )}
          </button>

          <div className="flex flex-col items-center">
            <div className="mb-2 leading-tight text-center">
              <T id="qrCode">{message => <span className="text-sm font-semibold text-gray-700">{message}</span>}</T>
            </div>

            <div className="p-1 bg-gray-100 border-2 border-gray-300 rounded" style={{ maxWidth: '60%' }}>
              <QRCode bgColor="#f7fafc" fgColor="#000000" level="Q" style={{ width: '100%' }} value={deeplink} />
            </div>
            <div className="mt-2 mb-2 leading-tight text-center">
              <a href="https://phoenix-wallet.rocks" target="_blank" rel="noopener noreferrer">
                <T id="usePhoenixWallet">
                  {message => <span className="underline text-xs text-gray-600">{message}</span>}
                </T>
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Receive;
