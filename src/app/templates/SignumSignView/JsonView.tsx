import React, { CSSProperties, memo, ReactNode } from 'react';

import classNames from 'clsx';
import ReactJson from 'react-json-view';

import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { T } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

type OperationsBannerProps = {
  jsonViewStyle?: CSSProperties;
  jsonObject: object;
  label?: ReactNode;
  className?: string;
};

const JsonView = memo<OperationsBannerProps>(({ jsonViewStyle, jsonObject, label, className }) => {
  return (
    <>
      {label && (
        <h2 className={classNames('w-full mb-2', 'text-base font-semibold leading-tight', 'text-gray-700')}>{label}</h2>
      )}

      <div className={classNames('relative mb-2', className)}>
        <div
          className={classNames(
            'block w-full max-w-full p-1',
            'rounded-md',
            'border-2 bg-gray-100 bg-opacity-50',
            'text-xs leading-tight font-medium',
            'break-all'
          )}
          style={{
            height: '10rem',
            ...jsonViewStyle
          }}
        >
          <ReactJson
            src={jsonObject}
            name={null}
            iconStyle="circle"
            indentWidth={2}
            enableClipboard={false}
            displayObjectSize={false}
            displayDataTypes={false}
          />
          {/*)}*/}
        </div>

        <div className={classNames('absolute top-0 right-0 pt-2 pr-2')}>
          <CopyButton toCopy={jsonObject} />
        </div>
      </div>
    </>
  );
});

export default JsonView;

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
