import React from 'react';

import PageLayout from 'app/layouts/PageLayout';
import NewWallet from 'app/templates/NewWallet';
import { t } from 'lib/i18n/react';

const ImportWallet = () => (
  <PageLayout>
    <NewWallet ownMnemonic title={t('restoreWallet')} />
  </PageLayout>
);

export default ImportWallet;
