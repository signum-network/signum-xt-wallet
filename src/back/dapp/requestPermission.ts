import { Address } from '@signumjs/core';
import { v4 as uuid } from 'uuid';

import { XTMessageType } from 'lib/messaging';

import { getDApp, getNetworkHosts, setDApp, getCurrentNetworkHost, getCurrentAccountId } from './dapp';
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
  const currentNodeHost = await getCurrentNetworkHost();
  if (currentNodeHost.networkName !== req.network) {
    throw new Error(ExtensionErrorType.InvalidNetwork);
  }
  const currentHostUrl = currentNodeHost.rpcBaseURL;
  const networkHosts = await getNetworkHosts(req.network);

  if (networkHosts.length === 0) {
    throw new Error(ExtensionErrorType.InvalidNetwork);
  }
  const hostUrls = networkHosts.map(({ rpcBaseURL }) => rpcBaseURL);
  const [dApp, accountId] = await Promise.all([getDApp(origin), getCurrentAccountId()]);

  // FIXME: This does not work
  const publicKey = Address.fromNumericId(accountId).getPublicKey();
  if (dApp && req.network === dApp.network && req.appMeta.name === dApp.appMeta.name) {
    return {
      type: ExtensionMessageType.PermissionResponse,
      availableNodeHosts: hostUrls,
      currentNodeHost: currentHostUrl,
      accountId,
      publicKey
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
        if (confirmReq?.type === XTMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: req.network,
              appMeta: req.appMeta
            });
            resolve({
              type: ExtensionMessageType.PermissionResponse,
              accountId,
              publicKey,
              availableNodeHosts: hostUrls,
              currentNodeHost: currentHostUrl
            });
          } else {
            decline();
          }

          return {
            type: XTMessageType.DAppPermConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
