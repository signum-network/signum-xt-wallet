import browser from 'webextension-polyfill';

import { TempleDAppSession, TempleDAppSessions } from 'lib/messaging';
import { loadChainId } from 'lib/temple/helpers';
import { NETWORKS } from 'lib/temple/networks';

import { ExtensionNetwork } from './typings';

const STORAGE_KEY = 'dapp_sessions';

export async function getAllDApps() {
  const dAppsSessions: TempleDAppSessions = (await browser.storage.local.get([STORAGE_KEY]))[STORAGE_KEY] || {};
  return dAppsSessions;
}

export async function getDApp(origin: string): Promise<TempleDAppSession | undefined> {
  return (await getAllDApps())[origin];
}

export async function setDApp(origin: string, permissions: TempleDAppSession) {
  const current = await getAllDApps();
  const newDApps = { ...current, [origin]: permissions };
  await setDApps(newDApps);
  return newDApps;
}

export async function removeDApp(origin: string) {
  const { [origin]: permissionsToRemove, ...restDApps } = await getAllDApps();
  await setDApps(restDApps);
  return restDApps;
}

export function cleanDApps() {
  return setDApps({});
}

function setDApps(newDApps: TempleDAppSessions) {
  return browser.storage.local.set({ [STORAGE_KEY]: newDApps });
}

export async function getNetworkRPC(net: ExtensionNetwork) {
  const targetRpc = typeof net === 'string' ? NETWORKS.find(n => n.id === net)!.rpcBaseURL : removeLastSlash(net.rpc);

  if (typeof net === 'string') {
    try {
      const current = await getCurrentTempleNetwork();
      const [currentChainId, targetChainId] = await Promise.all([
        loadChainId(current.rpcBaseURL),
        loadChainId(targetRpc).catch(() => null)
      ]);

      return targetChainId === null || currentChainId === targetChainId ? current.rpcBaseURL : targetRpc;
    } catch {
      return targetRpc;
    }
  } else {
    return targetRpc;
  }
}

async function getCurrentTempleNetwork() {
  const { network_id: networkId, custom_networks_snapshot: customNetworksSnapshot } = await browser.storage.local.get([
    'network_id',
    'custom_networks_snapshot'
  ]);

  return [...NETWORKS, ...(customNetworksSnapshot ?? [])].find(n => n.id === networkId) ?? NETWORKS[0];
}

export function isAllowedNetwork(net: ExtensionNetwork) {
  return typeof net === 'string' ? NETWORKS.some(n => !n.disabled && n.id === net) : Boolean(net?.rpc);
}

export function isNetworkEquals(fNet: ExtensionNetwork, sNet: ExtensionNetwork) {
  return typeof fNet !== 'string' && typeof sNet !== 'string'
    ? removeLastSlash(fNet.rpc) === removeLastSlash(sNet.rpc)
    : fNet === sNet;
}

function removeLastSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}
