import { Address } from '@signumjs/core';

import { XTAccountType } from 'lib/messaging';

import { getCurrentAccountInfo, getCurrentNetworkHost, getDApp, getNetworkHosts } from './dapp';
import { ExtensionGetCurrentPermissionResponse, ExtensionMessageType } from './typings';

export async function getCurrentPermission(origin: string): Promise<ExtensionGetCurrentPermissionResponse> {
  const [dApp, account] = await Promise.all([getDApp(origin), getCurrentAccountInfo()]);
  if (!dApp) {
    return {
      type: ExtensionMessageType.GetCurrentPermissionResponse,
      permission: null
    };
  }
  const currentNetworkHost = await getCurrentNetworkHost();
  const currentNodeHost = currentNetworkHost.rpcBaseURL;
  const networkHosts = await getNetworkHosts(dApp?.network);
  const availableNodeHosts = networkHosts.map(({ rpcBaseURL }) => rpcBaseURL);
  const publicKey = account.publicKey;
  const watchOnly = account.type === XTAccountType.WatchOnly;
  const accountId = Address.fromPublicKey(account.publicKey).getNumericId();
  return {
    type: ExtensionMessageType.GetCurrentPermissionResponse,
    permission: {
      availableNodeHosts,
      currentNodeHost,
      accountId,
      publicKey,
      watchOnly
    }
  };
}
