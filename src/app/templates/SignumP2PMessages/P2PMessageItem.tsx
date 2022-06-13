import React, { FC, memo, useCallback, useEffect, useMemo } from 'react';

import { Transaction } from '@signumjs/core';
import { decryptMessage } from '@signumjs/crypto';
import { ChainTime } from '@signumjs/util';
import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { ReactComponent as LockAltIcon } from 'app/icons/lock-alt.svg';
import HashChip from 'app/templates/HashChip';
import { getDateFnsLocale, T, t } from 'lib/i18n/react';
import { useAccount, useSignumExplorerBaseUrls, useTempleClient } from 'lib/temple/front';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useSafeState from 'lib/ui/useSafeState';

import Time from './Time';

type Props = {
  accountId: string;
  message: Transaction;
};

const P2PMessageItem = memo<Props>(({ accountId, message }) => {
  const { transaction: explorerBaseUrl } = useSignumExplorerBaseUrls();
  const client = useTempleClient();
  const { publicKey } = useAccount();
  const { transaction: txId, timestamp } = message;
  const [revealedMessage, setRevealedMessage] = useSafeState('');

  const dateFnsLocale = getDateFnsLocale();
  const isPending = message.blockTimestamp === undefined;
  const isEncrypted = message.attachment.encryptedMessage;
  const plainMessage = message.attachment.message;

  const transactionStatus = useMemo(() => {
    const content = isPending ? 'pending' : 'applied';
    return (
      <span className={classNames(isPending ? 'text-gray-700' : 'text-green-700', 'capitalize')}>{t(content)}</span>
    );
  }, [isPending]);

  const revealMessage = useCallback(async () => {
    if (!client || !message) return;

    const { p2pKey } = await client.getSignumTransactionKeys(publicKey);
    try {
      const msg = decryptMessage(message.attachment.encryptedMessage, message.senderPublicKey || '', p2pKey);
      setRevealedMessage(msg);
    } catch (e: any) {
      // no op
    }
  }, [message, client, publicKey, setRevealedMessage]);

  useEffect(() => {
    if (revealedMessage) {
      setTimeout(() => {
        setRevealedMessage('');
      }, 5_000);
    }
  }, [revealedMessage, setRevealedMessage]);

  return (
    <div className="relative my-3 flex flex-row justify-evenly">
      <div className="flex-1 flex-grow">
        <div className="flex flex-row items-center">
          <HashChip hash={txId!} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />
          {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} id={txId!} className="mr-2" />}
        </div>

        <div className="flex flex-row items-end">
          <div className="flex flex-col pt-2">
            <div className="mb-px text-xs font-light leading-none">{transactionStatus}</div>
            <Time
              children={() => (
                <span className="text-xs font-light text-gray-700">
                  {formatDistanceToNow(ChainTime.fromChainTimestamp(timestamp!).getDate(), {
                    includeSeconds: true,
                    addSuffix: true,
                    locale: dateFnsLocale
                  })}
                </span>
              )}
            />
          </div>
        </div>
      </div>
      <div className="mr-2">
        <CopyButton toCopy={isEncrypted ? revealedMessage : plainMessage} />
      </div>
      <div className="flex-1 flex-grow justify-end flex-wrap overflow-y-auto thin-scrollbar">
        <div className="text-xs font-light text-gray-700 ">
          {isEncrypted ? <SecretTextField value={revealedMessage} onClick={revealMessage} /> : plainMessage}
        </div>
      </div>
    </div>
  );
});

export default P2PMessageItem;

type SecretTextFieldProps = {
  value: string;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const SecretTextField: FC<SecretTextFieldProps> = ({ children, onClick, value }) => {
  return (
    <div
      className={classNames(
        'appearance-none',
        'w-full min-h-8',
        'p-1',
        'border-1',
        'border-gray-300',
        'focus:border-primary-orange',
        'bg-gray-100 focus:bg-transparent',
        'focus:outline-none focus:shadow-outline',
        'transition ease-in-out duration-200',
        'rounded-md',
        'text-gray-500 text-xs leading-tight',
        'placeholder-alphagray'
      )}
      onClick={onClick}
    >
      {!value ? (
        <div className="flex flex-row items-center justify-center cursor-pointer">
          <LockAltIcon className={classNames('ml-2 mr-1', 'h-6 w-auto', 'stroke-current stroke-2', 'text-gray-500')} />
          <T id="clickToReveal">{message => <span>{message}</span>}</T>
        </div>
      ) : (
        <p className="text-gray-700 text-xs leading-tight">{value}</p>
      )}
    </div>
  );
};

type CopyButtonProps = {
  toCopy: any;
};

const CopyButton = memo<CopyButtonProps>(({ toCopy }) => {
  const { fieldRef, copy, copied } = useCopyToClipboard<HTMLTextAreaElement>();

  const text = typeof toCopy === 'string' ? toCopy : JSON.stringify(toCopy, null, 2);

  return (
    <>
      <button
        type="button"
        className={classNames(
          'flex items-center justify-end right-1 w-full',
          'text-gray-500',
          'text-xs font-semibold leading-snug',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100 focus:opacity-100',
          'hover:shadow focus:shadow'
        )}
        onClick={copy}
      >
        {copied ? <T id="copiedHash" /> : <CopyIcon className={classNames('h-4 w-auto', 'stroke-current stroke-2')} />}
      </button>

      <textarea ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
});