import {getCurrentAccountId, getDApp, getNetworkHosts} from './dapp';
import { ExtensionGetCurrentPermissionResponse, ExtensionMessageType } from './typings';
import {Address} from '@signumjs/core';

export async function getCurrentPermission(origin: string): Promise<ExtensionGetCurrentPermissionResponse> {
  const [dApp, accountId] = await Promise.all([getDApp(origin), getCurrentAccountId()]);
  if (!dApp)
    return {
      type: ExtensionMessageType.GetCurrentPermissionResponse,
      permission: null
    };

  const networkHosts = await getNetworkHosts(dApp?.network);
  const nodeHosts = networkHosts.map(({ rpcBaseURL }) => rpcBaseURL);
  const publicKey = Address.fromNumericId(accountId).getPublicKey();
  return {
    type: ExtensionMessageType.GetCurrentPermissionResponse,
    permission: {
      nodeHosts,
      accountId,
      publicKey
    }
  };
}
