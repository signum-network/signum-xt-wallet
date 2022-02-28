import { getDApp, getNetworkHosts } from './dapp';
import { ExtensionGetCurrentPermissionResponse, ExtensionMessageType } from './typings';

export async function getCurrentPermission(origin: string): Promise<ExtensionGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  if (!dApp)
    return {
      type: ExtensionMessageType.GetCurrentPermissionResponse,
      permission: null
    };

  const networkHosts = await getNetworkHosts(dApp?.network);
  const nodeHosts = networkHosts.map(({ rpcBaseURL }) => rpcBaseURL);
  return {
    type: ExtensionMessageType.GetCurrentPermissionResponse,
    permission: {
      nodeHosts,
      accountId: dApp.accountId,
      publicKey: dApp.publicKey
    }
  };
}
