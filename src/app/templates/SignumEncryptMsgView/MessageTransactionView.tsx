import React, { FC } from 'react';

import HashShortView from 'app/atoms/HashShortView';
import IdenticonSignum from 'app/atoms/IdenticonSignum';
import { t } from 'lib/i18n/react';

type Props = {
  to: string;
  aliasName?: string;
};

const MessageTransactionView: FC<Props> = ({ to, aliasName }) => {
  return (
    <div className="text-gray-700 text-sm">
      <div className="relative rounded-md overflow-y-auto border flex flex-col text-gray-700 text-sm leading-tight h-40">
        <div className="pt-3 pb-2 px-2 flex justify-start items-center">
          <div className="mr-2">
            <IdenticonSignum address={to} size={40} className="shadow-xs" />
          </div>

          <div className="flex-1 flex-col">
            <div className="mb-1 text-xs text-gray-500 font-light flex flex-wrap">
              <span className="mr-1 flex text-blue-600 opacity-100">🔐 {t('encryptedMessageTo')}</span>
              <HashShortView hash={to} isAccount />
              {aliasName && <HashShortView hash={aliasName} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTransactionView;
