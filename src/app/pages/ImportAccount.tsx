import React, { FC, useEffect, useMemo, useRef } from 'react';

import TabSwitcher from 'app/atoms/TabSwitcher';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { T } from 'lib/i18n/react';
import { useSetCurrentAccount, useAllAccounts, useNetwork } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { ByMnemonicForm } from './ImportAccount/ByMnemonicForm';
import { WatchOnlyForm } from './ImportAccount/WatchOnlyForm';

type ImportAccountProps = {
  tabSlug: string | null;
};

const AllTabs = [
  {
    slug: 'mnemonic',
    i18nKey: 'mnemonic',
    ImportForm: ByMnemonicForm
  },
  {
    slug: 'watch-only',
    i18nKey: 'watchOnlyAccount',
    ImportForm: WatchOnlyForm
  }
];

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const network = useNetwork();
  const allAccounts = useAllAccounts();
  const setCurrentAccount = useSetCurrentAccount();

  const prevAccLengthRef = useRef(allAccounts.length);
  const prevNetworkRef = useRef(network);
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
  useEffect(() => {
    const prevNetworkType = prevNetworkRef.current.type;
    prevNetworkRef.current = network;
    if (prevNetworkType !== 'main' && network.type === 'main' && slug === 'faucet') {
      navigate(`/import-account/private-key`);
    }
  }, [network, slug]);

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
