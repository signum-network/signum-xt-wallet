import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import constate from 'constate';

import { IntercomClient } from 'lib/intercom';
import {
  TempleConfirmationPayload,
  TempleMessageType,
  TempleStatus,
  TempleRequest,
  TempleResponse,
  TempleNotification,
  TempleSettings,
  DerivationType
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
    const res = await request({ type: TempleMessageType.GetStateRequest });
    assertResponse(res.type === TempleMessageType.GetStateResponse);
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
        case TempleMessageType.StateUpdated:
          revalidate();
          break;

        case TempleMessageType.ConfirmationRequested:
          if (msg.id === confirmationIdRef.current) {
            setConfirmation({ id: msg.id, payload: msg.payload });
          }
          break;

        case TempleMessageType.ConfirmationExpired:
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
  const idle = status === TempleStatus.Idle;
  const locked = status === TempleStatus.Locked;
  const ready = status === TempleStatus.Ready;

  const customNetworks = useMemo(() => settings?.customNetworks ?? [], [settings]);
  const networks = useMemo(() => [...defaultNetworks, ...customNetworks], [defaultNetworks, customNetworks]);

  /**
   * Actions
   */

  const registerWallet = useCallback(async (password: string, mnemonic?: string) => {
    const res = await request({
      type: TempleMessageType.NewWalletRequest,
      password,
      mnemonic
    });
    assertResponse(res.type === TempleMessageType.NewWalletResponse);
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await request({
      type: TempleMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === TempleMessageType.UnlockResponse);
  }, []);

  const lock = useCallback(async () => {
    const res = await request({
      type: TempleMessageType.LockRequest
    });
    assertResponse(res.type === TempleMessageType.LockResponse);
  }, []);

  // TODO: not needed - we can use import Mnemonic Account
  const createAccount = useCallback(async (name?: string) => {
    const res = await request({
      type: TempleMessageType.CreateAccountRequest,
      name
    });
    assertResponse(res.type === TempleMessageType.CreateAccountResponse);
  }, []);

  // TODO: remove not used
  const revealPrivateKey = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: TempleMessageType.RevealPrivateKeyRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === TempleMessageType.RevealPrivateKeyResponse);
    return res.privateKey;
  }, []);

  const getSignumTransactionKeyPair = useCallback(async (accountPublicKeyHash: string) => {
    const res = await request({
      type: TempleMessageType.GetSignumTxKeysRequest,
      accountPublicKeyHash
    });
    assertResponse(res.type === TempleMessageType.GetSignumTxKeysResponse);
    return {
      publicKey: res.publicKey,
      signingKey: res.signingKey
    };
  }, []);

  // TODO: remove not used
  const revealMnemonic = useCallback(async (password: string) => {
    const res = await request({
      type: TempleMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === TempleMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const removeAccount = useCallback(async (accountPublicKeyHash: string, password: string) => {
    const res = await request({
      type: TempleMessageType.RemoveAccountRequest,
      accountPublicKeyHash,
      password
    });
    assertResponse(res.type === TempleMessageType.RemoveAccountResponse);
  }, []);

  const editAccountName = useCallback(async (accountPublicKeyHash: string, name: string) => {
    const res = await request({
      type: TempleMessageType.EditAccountRequest,
      accountPublicKeyHash,
      name
    });
    assertResponse(res.type === TempleMessageType.EditAccountResponse);
  }, []);

  const setAccountActivated = useCallback(async (accountPublicKeyHash: string) => {
    const res = await request({
      type: TempleMessageType.ActivateAccountRequest,
      accountPublicKeyHash
    });
    assertResponse(res.type === TempleMessageType.ActivateAccountResponse);
  }, []);

  const importAccount = useCallback(async (privateKey: string, encPassword?: string) => {
    const res = await request({
      type: TempleMessageType.ImportAccountRequest,
      privateKey,
      encPassword
    });
    assertResponse(res.type === TempleMessageType.ImportAccountResponse);
  }, []);

  const importMnemonicAccount = useCallback(async (mnemonic: string, name?) => {
    const res = await request({
      type: TempleMessageType.ImportMnemonicAccountRequest,
      mnemonic,
      name
    });
    assertResponse(res.type === TempleMessageType.ImportMnemonicAccountResponse);
  }, []);

  const importFundraiserAccount = useCallback(async (email: string, password: string, mnemonic: string) => {
    const res = await request({
      type: TempleMessageType.ImportFundraiserAccountRequest,
      email,
      password,
      mnemonic
    });
    assertResponse(res.type === TempleMessageType.ImportFundraiserAccountResponse);
  }, []);

  const importKTManagedAccount = useCallback(async (address: string, chainId: string, owner: string) => {
    const res = await request({
      type: TempleMessageType.ImportManagedKTAccountRequest,
      address,
      chainId,
      owner
    });
    assertResponse(res.type === TempleMessageType.ImportManagedKTAccountResponse);
  }, []);

  const importWatchOnlyAccount = useCallback(async (address: string, chainId?: string) => {
    const res = await request({
      type: TempleMessageType.ImportWatchOnlyAccountRequest,
      address,
      chainId
    });
    assertResponse(res.type === TempleMessageType.ImportWatchOnlyAccountResponse);
  }, []);

  const createLedgerAccount = useCallback(
    async (name: string, derivationType?: DerivationType, derivationPath?: string) => {
      const res = await request({
        type: TempleMessageType.CreateLedgerAccountRequest,
        name,
        derivationPath,
        derivationType
      });
      assertResponse(res.type === TempleMessageType.CreateLedgerAccountResponse);
    },
    []
  );

  const updateSettings = useCallback(async (settings: Partial<TempleSettings>) => {
    const res = await request({
      type: TempleMessageType.UpdateSettingsRequest,
      settings
    });
    assertResponse(res.type === TempleMessageType.UpdateSettingsResponse);
  }, []);

  const confirmInternal = useCallback(
    async (id: string, confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      const res = await request({
        type: TempleMessageType.ConfirmationRequest,
        id,
        confirmed,
        modifiedTotalFee,
        modifiedStorageLimit
      });
      assertResponse(res.type === TempleMessageType.ConfirmationResponse);
    },
    []
  );

  const getDAppPayload = useCallback(async (id: string) => {
    const res = await request({
      type: TempleMessageType.DAppGetPayloadRequest,
      id
    });
    assertResponse(res.type === TempleMessageType.DAppGetPayloadResponse);
    return res.payload;
  }, []);

  const confirmDAppPermission = useCallback(async (id: string, confirmed: boolean, pkh: string) => {
    const res = await request({
      type: TempleMessageType.DAppPermConfirmationRequest,
      id,
      confirmed,
      accountPublicKeyHash: pkh,
      accountPublicKey: confirmed ? await getPublicKey(pkh) : ''
    });
    assertResponse(res.type === TempleMessageType.DAppPermConfirmationResponse);
  }, []);

  const confirmDAppSign = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: TempleMessageType.DAppSignConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === TempleMessageType.DAppSignConfirmationResponse);
  }, []);

  const getAllDAppSessions = useCallback(async () => {
    const res = await request({
      type: TempleMessageType.DAppGetAllSessionsRequest
    });
    assertResponse(res.type === TempleMessageType.DAppGetAllSessionsResponse);
    return res.sessions;
  }, []);

  const removeDAppSession = useCallback(async (origin: string) => {
    const res = await request({
      type: TempleMessageType.DAppRemoveSessionRequest,
      origin
    });
    assertResponse(res.type === TempleMessageType.DAppRemoveSessionResponse);
    return res.sessions;
  }, []);

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
    importAccount,
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
    getAllDAppSessions,
    removeDAppSession,
    getSignumTransactionKeyPair
  };
});

async function getPublicKey(accountPublicKeyHash: string) {
  const res = await request({
    type: TempleMessageType.RevealPublicKeyRequest,
    accountPublicKeyHash
  });
  assertResponse(res.type === TempleMessageType.RevealPublicKeyResponse);
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
