import { XTMessageType, Network } from 'lib/messaging';

import { intercom } from '../defaults';

async function notifyDApps(message: any) {
  intercom.broadcast(message);
}

export function notifyNetworkChanged(newNetwork: Network) {
  notifyDApps({
    type: XTMessageType.DAppNetworkChanged,
    networkName: newNetwork.networkName,
    networkHost: newNetwork.rpcBaseURL
  });
}

export function notifyPermissionRemoved(url: string) {
  notifyDApps({
    type: XTMessageType.DAppPermissionRemoved,
    url: url
  });
}

export function notifyAccountRemoved(accountId: string) {
  notifyDApps({
    type: XTMessageType.DAppAccountRemoved,
    accountId: accountId
  });
}
