import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import constate from 'constate';

import { IntercomClient } from 'lib/intercom';
import {
  DerivationType,
  TempleConfirmationPayload,
  XTMessageType,
  TempleNotification,
  TempleRequest,
  TempleResponse,
  XTSettings,
  WalletStatus
} from 'lib/messaging';
import { useRetryableSWR } from 'lib/swr';

type Confirmation = {
  id: string;
  payload: TempleConfirmationPayload;
};

const intercom = new IntercomClient();

export const [TempleClientProvider, useTempleClient] = constate(() => {
  /**
   * State
   */

  const fetchState = useCallback(async () => {
    const res = await request({ type: XTMessageType.GetStateRequest });
    assertResponse(res.type === XTMessageType.GetStateResponse);
    return res.state;
  }, []);

  const { data, revalidate } = useRetryableSWR('state', fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const state = data!;

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationIdRef = useRef<string | null>(null);
  const resetConfirmation = useCallback(() => {
    confirmationIdRef.current = null;
    setConfirmation(null);
  }, [setConfirmation]);

  useEffect(() => {
    return intercom.subscribe((msg: TempleNotification) => {
      switch (msg?.type) {
        case XTMessageType.StateUpdated:
          revalidate();
          break;

        case XTMessageType.ConfirmationRequested:
          if (msg.id === confirmationIdRef.current) {
            setConfirmation({ id: msg.id, payload: msg.payload });
          }
          break;

        case XTMessageType.ConfirmationExpired:
          if (msg.id === confirmationIdRef.current) {
            resetConfirmation();
          }
          break;
      }
    });
  }, [revalidate, setConfirmation, resetConfirmation]);

  /**
   * Aliases
   */

  const { status, networks: defaultNetworks, accounts, settings } = state;
  const idle = status === WalletStatus.Idle;
  const locked = status === WalletStatus.Locked;
  const ready = status === WalletStatus.Ready;

  const customNetworks = useMemo(() => settings?.customNetworks ?? [], [settings]);
  const networks = useMemo(() => [...defaultNetworks, ...customNetworks], [defaultNetworks, customNetworks]);

  /**
   * Actions
   */

  const registerWallet = useCallback(async (password: string, mnemonic?: string) => {
    const res = await request({
      type: XTMessageType.NewWalletRequest,
      password,
      mnemonic
    });
    assertResponse(res.type === XTMessageType.NewWalletResponse);
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await request({
      type: XTMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === XTMessageType.UnlockResponse);
  }, []);

  const lock = useCallback(async () => {
    const res = await request({
      type: XTMessageType.LockRequest
    });
    assertResponse(res.type === XTMessageType.LockResponse);
  }, []);

  // TODO: not needed - we can use import Mnemonic Account
  const createAccount = useCallback(async (name?: string) => {
    const res = await request({
      type: XTMessageType.CreateAccountRequest,
      name
    });
    assertResponse(res.type === XTMessageType.CreateAccountResponse);
  }, []);

  // TODO: remove not used
  const revealPrivateKey = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: XTMessageType.RevealPrivateKeyRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === XTMessageType.RevealPrivateKeyResponse);
    return res.privateKey;
  }, []);

  const getSignumTransactionKeys = useCallback(async (accountPublicKeyHash: string) => {
    const res = await request({
      type: XTMessageType.GetSignumTxKeysRequest,
      accountPublicKeyHash
    });
    assertResponse(res.type === XTMessageType.GetSignumTxKeysResponse);
    return {
      publicKey: res.publicKey,
      signingKey: res.signingKey,
      p2pKey: res.p2pKey
    };
  }, []);

  // TODO: remove not used
  const revealMnemonic = useCallback(async (password: string) => {
    const res = await request({
      type: XTMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === XTMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const removeAccount = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: XTMessageType.RemoveAccountRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === XTMessageType.RemoveAccountResponse);
  }, []);

  const editAccountName = useCallback(async (accountPublicKey: string, name: string) => {
    const res = await request({
      type: XTMessageType.EditAccountRequest,
      accountPublicKey,
      name
    });
    assertResponse(res.type === XTMessageType.EditAccountResponse);
  }, []);

  const setAccountActivated = useCallback(async (accountPublicKey: string) => {
    const res = await request({
      type: XTMessageType.ActivateAccountRequest,
      accountPublicKey
    });
    assertResponse(res.type === XTMessageType.ActivateAccountResponse);
  }, []);

  const importMnemonicAccount = useCallback(async (mnemonic: string, name?) => {
    const res = await request({
      type: XTMessageType.ImportMnemonicAccountRequest,
      mnemonic,
      name
    });
    assertResponse(res.type === XTMessageType.ImportMnemonicAccountResponse);
  }, []);

  const importFundraiserAccount = useCallback(async (email: string, password: string, mnemonic: string) => {
    const res = await request({
      type: XTMessageType.ImportFundraiserAccountRequest,
      email,
      password,
      mnemonic
    });
    assertResponse(res.type === XTMessageType.ImportFundraiserAccountResponse);
  }, []);

  const importKTManagedAccount = useCallback(async (address: string, chainId: string, owner: string) => {
    const res = await request({
      type: XTMessageType.ImportManagedKTAccountRequest,
      address,
      chainId,
      owner
    });
    assertResponse(res.type === XTMessageType.ImportManagedKTAccountResponse);
  }, []);

  const importWatchOnlyAccount = useCallback(async (address: string, chainId?: string) => {
    const res = await request({
      type: XTMessageType.ImportWatchOnlyAccountRequest,
      address,
      chainId
    });
    assertResponse(res.type === XTMessageType.ImportWatchOnlyAccountResponse);
  }, []);

  const createLedgerAccount = useCallback(
    async (name: string, derivationType?: DerivationType, derivationPath?: string) => {
      const res = await request({
        type: XTMessageType.CreateLedgerAccountRequest,
        name,
        derivationPath,
        derivationType
      });
      assertResponse(res.type === XTMessageType.CreateLedgerAccountResponse);
    },
    []
  );

  const updateSettings = useCallback(async (settings: Partial<XTSettings>) => {
    const res = await request({
      type: XTMessageType.UpdateSettingsRequest,
      settings
    });
    assertResponse(res.type === XTMessageType.UpdateSettingsResponse);
  }, []);

  const confirmInternal = useCallback(
    async (id: string, confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      const res = await request({
        type: XTMessageType.ConfirmationRequest,
        id,
        confirmed,
        modifiedTotalFee,
        modifiedStorageLimit
      });
      assertResponse(res.type === XTMessageType.ConfirmationResponse);
    },
    []
  );

  const getDAppPayload = useCallback(async (id: string) => {
    const res = await request({
      type: XTMessageType.DAppGetPayloadRequest,
      id
    });
    assertResponse(res.type === XTMessageType.DAppGetPayloadResponse);
    return res.payload;
  }, []);

  const confirmDAppPermission = useCallback(async (id: string, confirmed: boolean, pkh: string) => {
    const res = await request({
      type: XTMessageType.DAppPermConfirmationRequest,
      id,
      confirmed,
      accountPublicKeyHash: pkh,
      accountPublicKey: confirmed ? await getPublicKey(pkh) : ''
    });
    assertResponse(res.type === XTMessageType.DAppPermConfirmationResponse);
  }, []);

  const confirmDAppSign = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: XTMessageType.DAppSignConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === XTMessageType.DAppSignConfirmationResponse);
  }, []);

  const confirmDAppSendEncryptedMessage = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: XTMessageType.DAppSendEncryptedMessageConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === XTMessageType.DAppSendEncryptedMessageConfirmationResponse);
  }, []);

  const getAllDAppSessions = useCallback(async () => {
    const res = await request({
      type: XTMessageType.DAppGetAllSessionsRequest
    });
    assertResponse(res.type === XTMessageType.DAppGetAllSessionsResponse);
    return res.sessions;
  }, []);

  const removeDAppSession = useCallback(async (origin: string) => {
    const res = await request({
      type: XTMessageType.DAppRemoveSessionRequest,
      origin
    });
    assertResponse(res.type === XTMessageType.DAppRemoveSessionResponse);
    return res.sessions;
  }, []);

  const selectNetwork = useCallback(
    async networkId => {
      const network = networks.find(({ id }) => id === networkId);
      if (!network) return;
      const res = await request({
        type: XTMessageType.DAppSelectNetworkRequest,
        network
      });
      assertResponse(res.type === XTMessageType.DAppSelectNetworkResponse);
    },
    [networks]
  );

  const selectAccount = useCallback(
    async accountPublicKey => {
      const account = accounts.find(({ publicKey }) => publicKey === accountPublicKey);
      if (!account) return;
      const res = await request({
        type: XTMessageType.DAppSelectAccountRequest,
        account
      });
      assertResponse(res.type === XTMessageType.DAppSelectAccountResponse);
    },
    [accounts]
  );

  return {
    state,

    // Aliases
    status,
    defaultNetworks,
    customNetworks,
    networks,
    accounts,
    settings,
    idle,
    locked,
    ready,

    // Misc
    confirmation,
    resetConfirmation,

    // Actions
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    removeAccount,
    editAccountName,
    setAccountActivated,
    // importAccount,
    importMnemonicAccount,
    importFundraiserAccount,
    importKTManagedAccount,
    importWatchOnlyAccount,
    createLedgerAccount,
    updateSettings,
    confirmInternal,
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppSign,
    confirmDAppSendEncryptedMessage,
    getAllDAppSessions,
    removeDAppSession,
    getSignumTransactionKeys,
    selectNetwork,
    selectAccount
  };
});

async function getPublicKey(accountPublicKeyHash: string) {
  const res = await request({
    type: XTMessageType.RevealPublicKeyRequest,
    accountPublicKeyHash
  });
  assertResponse(res.type === XTMessageType.RevealPublicKeyResponse);
  return res.publicKey;
}

async function request<T extends TempleRequest>(req: T) {
  const res = await intercom.request(req);
  assertResponse('type' in res);
  return res as TempleResponse;
}

function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error('Invalid response received');
  }
}
