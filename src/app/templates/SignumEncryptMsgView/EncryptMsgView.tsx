import React, { FC, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import MessageTransactionView from 'app/templates/SignumEncryptMsgView/MessageTransactionView';
import MessageView from 'app/templates/SignumEncryptMsgView/MessageView';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import { TempleDAppSendEncryptedMessagePayload, useSignumAssetMetadata } from 'lib/temple/front';

type Props = {
  payload: TempleDAppSendEncryptedMessagePayload;
};

const EncryptMsgView: FC<Props> = ({ payload }) => {
  const { symbol } = useSignumAssetMetadata();

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

  return (
    <div className="flex flex-col w-full">
      <h2 className="mb-3 leading-tight flex items-center">
        <T id="payloadToSign">
          {message => <span className="mr-2 text-base font-semibold text-gray-700">{message}</span>}
        </T>

        <div className="flex-1" />

        <ViewsSwitcher activeItem={signViewFormat} items={SigningViewFormats} onChange={setSignViewFormat} />
      </h2>

      <div className={classNames(signViewFormat.key !== 'raw' && 'hidden')}>
        <MessageView plainMessage={payload.plainMessage} />
      </div>
      <div className={classNames(signViewFormat.key !== 'preview' && 'hidden')}>
        <MessageTransactionView to={payload.targetPkh} />
      </div>

      <div className="mt-4 leading-tight flex text-base font-semibold text-gray-700 items-center justify-between w-full">
        <span>{t('totalAmount')}</span>
        <span>
          {payload.feeSigna}&nbsp;{symbol}
        </span>
      </div>
    </div>
  );
};

export default EncryptMsgView;
