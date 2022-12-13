import { Runtime } from 'webextension-polyfill';

import { TempleRequest, TempleResponse, XTMessageType } from 'lib/messaging';

import * as Actions from './actions';
import { initContextMenu } from './context-menus';
import * as DAppNotifications from './dapp/notifications';
import { intercom } from './defaults';
import { initOmnibox } from './omnibox';
import { initSrc47Resolver } from './src47Resolver';
import { store, toFront } from './store';

export async function start() {
  intercom.onRequest(processRequest);
  initContextMenu();
  initSrc47Resolver();
  initOmnibox();
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
      const {
        signingKey,
        publicKey: pubKey,
        p2pEncryptionKey: p2pKey
      } = await Actions.getSignumTxKeys(req.accountPublicKeyHash);
      return {
        type: XTMessageType.GetSignumTxKeysResponse,
        signingKey,
        publicKey: pubKey,
        p2pKey
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

    case XTMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(req.mnemonic, req.name);
      return {
        type: XTMessageType.ImportMnemonicAccountResponse
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
    case XTMessageType.PageTextSelectedRequest:
      await Actions.handlePageTextSelected(req.origin, req.selected);
      return {
        type: XTMessageType.PageTextSelectedResponse
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
      if (!dAppEnabled) break;
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
}
