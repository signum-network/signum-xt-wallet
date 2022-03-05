import { Runtime } from 'webextension-polyfill';

import { XTMessageType, TempleRequest, TempleResponse } from 'lib/messaging';

import * as Actions from './actions';
import * as DAppNotifications from './dapp/notifications';
import { intercom } from './defaults';
import { store, toFront } from './store';

export async function start() {
  intercom.onRequest(processRequest);
  await Actions.init();
  const frontStore = store.map(toFront);
  frontStore.watch(() => {
    intercom.broadcast({ type: XTMessageType.StateUpdated });
  });
}

// TODO: clean up all unused methods
async function processRequest(req: TempleRequest, port: Runtime.Port): Promise<TempleResponse | void> {
  switch (req?.type) {
    case XTMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: XTMessageType.GetStateResponse,
        state
      };
    case XTMessageType.GetSignumTxKeysRequest:
      const { signingKey, publicKey: pk } = await Actions.getSignumTxKeys(req.accountPublicKeyHash);
      return {
        type: XTMessageType.GetSignumTxKeysResponse,
        signingKey,
        publicKey: pk
      };
    case XTMessageType.NewWalletRequest:
      await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: XTMessageType.NewWalletResponse };

    case XTMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: XTMessageType.UnlockResponse };

    case XTMessageType.LockRequest:
      await Actions.lock();
      return { type: XTMessageType.LockResponse };

    case XTMessageType.CreateAccountRequest: {
      const mnemonic = await Actions.createAccount(req.name);
      return {
        type: XTMessageType.CreateAccountResponse,
        mnemonic
      };
    }

    case XTMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountPublicKeyHash);
      return {
        type: XTMessageType.RevealPublicKeyResponse,
        publicKey
      };

    case XTMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(req.accountPublicKeyHash, req.password);
      return {
        type: XTMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case XTMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.password);
      return {
        type: XTMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case XTMessageType.RemoveAccountRequest:
      await Actions.removeAccount(req.accountPublicKeyHash, req.password);
      DAppNotifications.notifyAccountRemoved(req.accountPublicKeyHash);
      return {
        type: XTMessageType.RemoveAccountResponse
      };

    case XTMessageType.EditAccountRequest:
      await Actions.editAccountName(req.accountPublicKey, req.name);
      return {
        type: XTMessageType.EditAccountResponse
      };

    case XTMessageType.ActivateAccountRequest:
      await Actions.setAccountActivated(req.accountPublicKey);
      return {
        type: XTMessageType.ActivateAccountResponse
      };

    // case XTMessageType.ImportAccountRequest:
    //   await Actions.importAccount(req.privateKey, req.encPassword);
    //   return {
    //     type: XTMessageType.ImportAccountResponse
    //   };

    case XTMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(req.mnemonic, req.name);
      return {
        type: XTMessageType.ImportMnemonicAccountResponse
      };

    case XTMessageType.ImportFundraiserAccountRequest:
      await Actions.importFundraiserAccount(req.email, req.password, req.mnemonic);
      return {
        type: XTMessageType.ImportFundraiserAccountResponse
      };

    case XTMessageType.ImportManagedKTAccountRequest:
      await Actions.importManagedKTAccount(req.address, req.chainId, req.owner);
      return {
        type: XTMessageType.ImportManagedKTAccountResponse
      };

    case XTMessageType.ImportWatchOnlyAccountRequest:
      await Actions.importWatchOnlyAccount(req.address, req.chainId);
      return {
        type: XTMessageType.ImportWatchOnlyAccountResponse
      };

    case XTMessageType.UpdateSettingsRequest:
      await Actions.updateSettings(req.settings);
      return {
        type: XTMessageType.UpdateSettingsResponse
      };

    case XTMessageType.SignRequest:
      const result = await Actions.sign(port, req.id, req.sourcePkh, req.bytes, req.watermark);
      return {
        type: XTMessageType.SignResponse,
        result
      };

    case XTMessageType.DAppGetAllSessionsRequest:
      const allSessions = await Actions.getAllDAppSessions();
      return {
        type: XTMessageType.DAppGetAllSessionsResponse,
        sessions: allSessions
      };

    case XTMessageType.DAppRemoveSessionRequest:
      const sessions = await Actions.removeDAppSession(req.origin);
      DAppNotifications.notifyPermissionRemoved(req.origin);
      return {
        type: XTMessageType.DAppRemoveSessionResponse,
        sessions
      };

    case XTMessageType.DAppSelectNetworkRequest:
      DAppNotifications.notifyNetworkChanged(req.network);
      return {
        type: XTMessageType.DAppSelectNetworkResponse
      };

    case XTMessageType.DAppSelectAccountRequest:
      DAppNotifications.notifyAccountChanged(req.account);
      return {
        type: XTMessageType.DAppSelectAccountResponse
      };

    case XTMessageType.PageRequest:
      const dAppEnabled = await Actions.isDAppEnabled();
      if (dAppEnabled) {
        if (req.payload === 'PING') {
          return {
            type: XTMessageType.PageResponse,
            payload: 'PONG'
          };
        }
        const resPayload = await Actions.processDApp(req.origin, req.payload);
        return {
          type: XTMessageType.PageResponse,
          payload: resPayload ?? null
        };
      }
      break;
  }
}
