import { v4 as uuid } from 'uuid';

import { TempleMessageType } from 'lib/messaging';

import { getDApp, getNetworkHosts, setDApp, isAllowedNetwork } from './dapp';
import { requestConfirm } from './requestConfirm';
import {
  ExtensionErrorType,
  ExtensionMessageType,
  ExtensionPermissionRequest,
  ExtensionPermissionResponse
} from './typings';

export async function requestPermission(
  origin: string,
  req: ExtensionPermissionRequest
): Promise<ExtensionPermissionResponse> {
  if (![isAllowedNetwork(req?.network), typeof req?.appMeta?.name === 'string'].every(Boolean)) {
    throw new Error(ExtensionErrorType.InvalidParams);
  }

  const networkHosts = await getNetworkHosts(req.network);
  const dApp = await getDApp(origin);

  if (!req.force && dApp && req.network === dApp.network && req.appMeta.name === dApp.appMeta.name) {
    return {
      type: ExtensionMessageType.PermissionResponse,
      nodeHosts: networkHosts,
      accountId: dApp.accountId,
      publicKey: dApp.publicKey
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        network: req.network,
        appMeta: req.appMeta
      },
      onDecline: () => {
        reject(new Error(ExtensionErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: req.network,
              appMeta: req.appMeta,
              accountId: accountPublicKeyHash,
              publicKey: accountPublicKey
            });
            resolve({
              type: ExtensionMessageType.PermissionResponse,
              accountId: accountPublicKeyHash,
              publicKey: accountPublicKey,
              nodeHosts: networkHosts
            });
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppPermConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
