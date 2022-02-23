import { getDApp, getNetworkRPC } from './dapp';
import { ExtensionMessageType, ExtensionGetCurrentPermissionResponse } from './typings';

export async function getCurrentPermission(origin: string): Promise<ExtensionGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  const permission = dApp
    ? {
        rpc: await getNetworkRPC(dApp.network),
        pkh: dApp.pkh,
        publicKey: dApp.publicKey
      }
    : null;
  return {
    type: ExtensionMessageType.GetCurrentPermissionResponse,
    permission
  };
}
