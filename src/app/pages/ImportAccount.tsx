import React, { FC, useEffect, useMemo, useRef } from 'react';

import TabSwitcher from 'app/atoms/TabSwitcher';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { T } from 'lib/i18n/react';
import { useSetCurrentAccount, useAllAccounts, useNetwork } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { ByRecoveryPhraseForm } from './ImportAccount/ByMnemonicForm';
import { WatchOnlyForm } from './ImportAccount/WatchOnlyForm';
import { ByNostrKeyForm } from './ImportAccount/NostrForm';

type ImportAccountProps = {
  tabSlug: string | null;
};

const AllTabs = [
  {
    slug: 'mnemonic',
    i18nKey: 'mnemonic',
    ImportForm: ByRecoveryPhraseForm
  },
  {
    slug: 'watch-only',
    i18nKey: 'watchOnlyAccount',
    ImportForm: WatchOnlyForm
  },
  {
    slug: 'nostr',
    i18nKey: 'nostrPrivateKey',
    ImportForm: ByNostrKeyForm
  }
];

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const allAccounts = useAllAccounts();
  const setCurrentAccount = useSetCurrentAccount();
  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setCurrentAccount(allAccounts[accLength - 1]);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setCurrentAccount]);

  const { slug, ImportForm } = useMemo(() => {
    const tab = tabSlug ? AllTabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? AllTabs[0];
  }, [tabSlug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <DownloadIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="importAccount">{message => <span className="capitalize">{message}</span>}</T>
        </>
      }
    >
      <div className="py-4">
        <TabSwitcher className="mb-4" tabs={AllTabs} activeTabSlug={slug} urlPrefix="/import-account" />
        <ImportForm />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;
