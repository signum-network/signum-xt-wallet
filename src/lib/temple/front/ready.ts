import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import { Ledger, LedgerClientFactory } from '@signumjs/core';
import constate from 'constate';

import { ReadyState, AppState, WalletStatus, usePassiveStorage, useTempleClient } from 'lib/temple/front';

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useSetAccountPkh,
  useAccount,
  useSettings,
  useSignum
] = constate(
  useReadyTemple,
  v => v.allNetworks,
  v => v.setNetworkId,
  v => v.network,
  v => v.allAccounts,
  v => v.setAccountPkh,
  v => v.account,
  v => v.settings,
  v => v.signum
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const { networks: allNetworks, accounts: allAccounts, settings } = templeFront;

  /**
   * Networks
   */

  const defaultNet = allNetworks[0];
  const [networkId, updateNetworkId] = usePassiveStorage('network_id', '');

  const setNetworkId = useCallback(
    (id: string) => {
      templeFront.selectNetwork(id); // propagate to back and dapp
      updateNetworkId(id);
    },
    [updateNetworkId, templeFront]
  );

  useEffect(() => {
    async function getBestNetwork() {
      const allMainNets = allNetworks.filter(n => n.type === 'main');
      const client = LedgerClientFactory.createClient({
        nodeHost: allMainNets[0].rpcBaseURL,
        reliableNodeHosts: allMainNets.map(n => n.rpcBaseURL)
      });
      const hostUrl = await client.service.selectBestHost(false);
      const found = allNetworks.find(n => n.rpcBaseURL === hostUrl);
      setNetworkId(found?.id || allMainNets[0].id);
    }

    if (!networkId) {
      getBestNetwork();
    }
  }, [allNetworks, networkId, setNetworkId, defaultNet]);

  const network = useMemo(
    () => allNetworks.find(n => n.id === networkId) ?? defaultNet,
    [allNetworks, networkId, defaultNet]
  );

  /**
   * Accounts
   */

  const defaultAcc = allAccounts[0];
  const [accountPkh, updateAccountPkh] = usePassiveStorage('account_publickey', defaultAcc.publicKey);

  const setAccountPkh = useCallback(
    (publicKey: string) => {
      templeFront.selectAccount(publicKey); // propagate to back and dapp
      updateAccountPkh(publicKey);
    },
    [updateAccountPkh, templeFront]
  );

  useEffect(() => {
    if (allAccounts.every(a => a.publicKey !== accountPkh)) {
      setAccountPkh(defaultAcc.publicKey);
    }
  }, [allAccounts, accountPkh, setAccountPkh, defaultAcc]);

  const account = useMemo(
    () => allAccounts.find(a => a.publicKey === accountPkh) ?? defaultAcc,
    [allAccounts, accountPkh, defaultAcc]
  );

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountPkh]);

  const signum = useMemo<Ledger>(() => {
    return LedgerClientFactory.createClient({
      nodeHost: network.rpcBaseURL
    });
  }, [network]);

  return {
    allNetworks,
    network,
    networkId,
    setNetworkId,

    allAccounts,
    account,
    accountPkh,
    setAccountPkh,

    settings,
    signum
  };
}

export function useRelevantAccounts() {
  const allAccounts = useAllAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  useEffect(() => {
    if (allAccounts.every(a => a.publicKey !== account.publicKey)) {
      setAccountPkh(allAccounts[0].publicKey);
    }
  }, [allAccounts, account, setAccountPkh]);

  return useMemo(() => allAccounts, [allAccounts]);
}

function assertReady(state: AppState): asserts state is ReadyState {
  if (state.status !== WalletStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
