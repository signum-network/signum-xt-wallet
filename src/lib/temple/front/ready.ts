import { useEffect, useLayoutEffect, useMemo } from 'react';

import { LedgerClientFactory } from '@signumjs/core';
import { TezosToolkit } from '@taquito/taquito';
import constate from 'constate';

import { IS_DEV_ENV } from 'app/env';
import {
  loadFastRpcClient,
  ReadyTempleState,
  TempleState,
  TempleStatus,
  usePassiveStorage,
  useTempleClient
} from 'lib/temple/front';

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated
}

export const [
  ReadyTempleProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useSetAccountPkh,
  useAccount,
  useSettings,
  useTezos,
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
  v => v.tezos,
  v => v.signum
);

function useReadyTemple() {
  const templeFront = useTempleClient();
  assertReady(templeFront);

  const {
    networks: allNetworks,
    accounts: allAccounts,
    settings,
  } = templeFront;

  /**
   * Networks
   */

  const defaultNet = allNetworks[0];
  const [networkId, setNetworkId] = usePassiveStorage('network_id', '');

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
  const [accountPkh, setAccountPkh] = usePassiveStorage('account_publickeyhash', defaultAcc.publicKeyHash);

  useEffect(() => {
    if (allAccounts.every(a => a.publicKeyHash !== accountPkh)) {
      setAccountPkh(defaultAcc.publicKeyHash);
    }
  }, [allAccounts, accountPkh, setAccountPkh, defaultAcc]);

  const account = useMemo(
    () => allAccounts.find(a => a.publicKeyHash === accountPkh) ?? defaultAcc,
    [allAccounts, accountPkh, defaultAcc]
  );

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountPkh]);

  /**
   * tezos = TezosToolkit instance
   * TODO: remove that
   */
  const tezos = useMemo(() => {
    const checksum = [network.id, account.publicKeyHash].join('_');
    const rpc = network.rpcBaseURL;
    // const pkh = account.type === TempleAccountType.ManagedKT ? account.owner : account.publicKeyHash;

    const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), checksum);
    // t.setSignerProvider(createTaquitoSigner(pkh));
    // t.setWalletProvider(createTaquitoWallet(pkh, rpc));
    // t.setPackerProvider(michelEncoder);
    return t;
  }, [network, account]);

  useEffect(() => {
    if (IS_DEV_ENV) {
      (window as any).tezos = tezos;
    }
  }, [tezos]);

  const signum = useMemo(() => {
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
    tezos, // TODO: remove tezos
    signum
  };
}

export function useRelevantAccounts(withExtraTypes = true) {
  const allAccounts = useAllAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();
  useEffect(() => {
    if (allAccounts.every(a => a.publicKeyHash !== account.publicKeyHash)) {
      setAccountPkh(allAccounts[0].publicKeyHash);
    }
  }, [allAccounts, account, setAccountPkh]);

  return useMemo(() => allAccounts, [allAccounts]);
}

// FIXME: remove it
export class ReactiveTezosToolkit extends TezosToolkit {
  constructor(rpc: string | any, public checksum: string, public lambdaContract?: string) {
    super(rpc);
    // this.addExtension(new Tzip16Module());
  }
}

function assertReady(state: TempleState): asserts state is ReadyTempleState {
  if (state.status !== TempleStatus.Ready) {
    throw new Error('Temple not ready');
  }
}
