import React, { memo, ReactNode, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import JsonView from 'app/templates/JsonView';
import { T } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

type MessageViewProps = {
  label?: ReactNode;
  plainMessage: string;
  className?: string;
};

const HexPattern = /^[0-9a-fA-F]+$/;

const MessageView = memo<MessageViewProps>(({ label, plainMessage, className }) => {
  const json = useMemo(() => {
    try {
      return JSON.parse(plainMessage);
    } catch (e: any) {
      return null;
    }
  }, [plainMessage]);

  const binary = useMemo(() => {
    if (plainMessage && plainMessage.length % 2 === 0 && HexPattern.test(plainMessage)) {
      let bin: string[] = [];
      for (let i = 0; i < plainMessage.length; i += 2) {
        bin.push(plainMessage.substr(i, 2).toUpperCase());
      }
      return bin;
    }
    return null;
  }, [plainMessage]);

  return (
    <>
      <div className={classNames('relative', className)}>
        {json && <JsonView jsonObject={json} jsonViewStyle={{ maxHeight: '100%', overflow: 'auto' }} />}
        {binary && (
          <div
            className={classNames(
              'w-full max-w-full p-1 h-40',
              'rounded-md',
              'border bg-gray-100 bg-opacity-50',
              'text-xs leading-tight font-medium font-mono',
              'break-all'
            )}
            style={{
              maxHeight: '100%',
              overflow: 'auto'
            }}
          >
            <span className="flex flex-wrap">
              {binary.map((byte, index) => (
                <pre className="mr-2">{byte}</pre>
              ))}
            </span>
            <div className="absolute bottom-0 right-1 text-gray-500">{binary.length} bytes</div>
          </div>
        )}

        {!json && !binary && (
          <div
            className={classNames(
              'block w-full max-w-full p-1 h-40',
              'rounded-md',
              'border bg-gray-100 bg-opacity-50',
              'text-xs leading-tight font-medium',
              'break-all'
            )}
            style={{
              maxHeight: '100%',
              overflow: 'auto'
            }}
          >
            {plainMessage}
          </div>
        )}

        <div className={classNames('absolute top-0 right-0 pt-2 pr-2')}>
          <CopyButton toCopy={plainMessage} />
        </div>
      </div>
    </>
  );
});

export default MessageView;

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
          'mx-auto',
          'p-1',
          'bg-primary-orange rounded',
          'border border-primary-orange',
          'flex items-center justify-center',
          'text-primary-orange-lighter text-shadow-black-orange',
          'text-xs font-semibold leading-snug',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100 focus:opacity-100',
          'shadow-sm',
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
