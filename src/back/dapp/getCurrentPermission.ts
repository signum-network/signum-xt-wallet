import { Address } from '@signumjs/core';

import { getCurrentAccountPublicKey, getCurrentNetworkHost, getDApp, getNetworkHosts } from './dapp';
import { ExtensionGetCurrentPermissionResponse, ExtensionMessageType } from './typings';

export async function getCurrentPermission(origin: string): Promise<ExtensionGetCurrentPermissionResponse> {
  const [dApp, publicKey] = await Promise.all([getDApp(origin), getCurrentAccountPublicKey()]);
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
  const accountId = Address.fromPublicKey(publicKey).getNumericId();
  return {
    type: ExtensionMessageType.GetCurrentPermissionResponse,
    permission: {
      availableNodeHosts,
      currentNodeHost,
      accountId,
      publicKey
    }
  };
}
