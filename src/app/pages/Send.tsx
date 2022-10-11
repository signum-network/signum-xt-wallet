import React, { FC } from 'react';

import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import PageLayout from 'app/layouts/PageLayout';
import SendForm from 'app/templates/SignumSendForm';
import { t } from 'lib/i18n/react';
import { SIGNA_TOKEN_ID } from 'lib/temple/front';

type SendProps = {
  tokenId: string | null;
  recipient: string | null;
};

const Send: FC<SendProps> = ({ tokenId, recipient }) => (
  <PageLayout
    pageTitle={
      <>
        <SendIcon className="w-auto h-4 mr-1 stroke-current" /> {t('send')}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SendForm tokenId={tokenId || SIGNA_TOKEN_ID} recipient={recipient || undefined} />
      </div>
    </div>
  </PageLayout>
);

export default Send;
