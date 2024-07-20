export interface ExtensionDAppMetadata {
  name: string;
}

type NonEmptyArray<T> = [T, ...T[]];

export interface ReadyState extends AppState {
  status: WalletStatus.Ready;
  accounts: NonEmptyArray<XTAccount>;
  networks: NonEmptyArray<Network>;
  settings: XTSettings;
}

export interface DAppSession {
  network: string;
  appMeta: ExtensionDAppMetadata;
}

export interface AppState {
  status: WalletStatus;
  accounts: XTAccount[];
  networks: Network[];
  settings: XTSettings | null;
}

export enum WalletStatus {
  Idle,
  Locked,
  Ready
}

export type XTAccount = HDAccount | ImportedAccount | LedgerAccount | XTManagedKTAccount | WatchOnlyAccount;

export enum DerivationType {
  ED25519 = 0,
  SECP256K1 = 1,
  P256 = 2
}

export interface LedgerAccount extends XTAccountBase {
  type: XTAccountType.Ledger;
  derivationPath: string;
}

export interface ImportedAccount extends XTAccountBase {
  type: XTAccountType.Eigen;
}

export interface HDAccount extends XTAccountBase {
  type: XTAccountType.HD;
  hdIndex: number;
}

// TODO: remove - it's obsolete
export interface XTManagedKTAccount extends XTAccountBase {
  type: XTAccountType.ManagedKT;
  chainId: string;
  owner: string;
}

export interface WatchOnlyAccount extends XTAccountBase {
  type: XTAccountType.WatchOnly;
  chainId?: string;
}

export interface XTAccountBase {
  type: XTAccountType;
  name: string;
  publicKey: string;
  publicKeyNostr?: string;
  accountId: string;
  isActivated?: boolean;
  hdIndex?: number;
  derivationPath?: string;
  derivationType?: DerivationType;
}

export enum XTAccountType {
  HD,
  Eigen,
  Ledger,
  ManagedKT,
  WatchOnly
}

export interface Network {
  id: string;
  networkName: string;
  name: string;
  nameI18nKey?: string;
  description: string;
  descriptionI18nKey?: string;
  type: NetworkType;
  rpcBaseURL: string;
  color: string;
  disabled: boolean;
  hidden?: boolean;
}

export type NetworkType = 'main' | 'test';

export interface Contact {
  accountId: string;
  rsAddress: string;
  name: string;
  addedAt?: number;
  accountInWallet?: boolean;
}

export interface NostrRelayPolicy {
  read: boolean;
  write: boolean;
}

export type NostrRelays = Record<string, NostrRelayPolicy>;

export interface XTSettings {
  publicResourceUrl?: string;
  customNetworks?: Network[];
  nostrRelays?: NostrRelays;
  lambdaContracts?: Record<string, string>;
  contacts?: Contact[];
}

export enum XTSharedStorageKey {
  DAppEnabled = 'dappenabled',
  PasswordAttempts = 'passwordAttempts',
  TimeLock = 'timelock',
  SelectedText = 'selectedText'
}

export type DAppSessions = Record<string, DAppSession>;

/**
 * Internal confirmation payloads
 */
export interface TempleConfirmationPayloadBase {
  type: string;
  sourcePkh: string;
}

export interface TempleSignConfirmationPayload extends TempleConfirmationPayloadBase {
  type: 'sign';
  bytes: string;
  watermark?: string;
}

export type TempleConfirmationPayload = TempleSignConfirmationPayload;

/**
 * DApp confirmation payloads
 */

export interface TempleDAppPayloadBase {
  type: string;
  origin: string;
  network: string;
  appMeta: ExtensionDAppMetadata;
}

export interface TempleDAppConnectPayload extends TempleDAppPayloadBase {
  type: 'connect';
}

export interface TempleNostrSignPayload extends TempleDAppPayloadBase {
  type: 'signNostr';
  sourcePkh: string;
  nostrPubKey: string;
  event: object; // Nostr Event Type
}

export interface TempleDAppSignPayload extends TempleDAppPayloadBase {
  type: 'sign';
  sourcePkh: string;
  payload: string;
  preview: string;
}

export interface TempleDAppSendEncryptedMessagePayload extends TempleDAppPayloadBase {
  type: 'sendEncryptedMsg';
  sourcePkh: string;
  targetPkh: string;
  plainMessage: string;
  messageIsText: boolean;
  feeSigna: string;
}

export type TempleDAppPayload =
  | TempleDAppConnectPayload
  | TempleDAppSignPayload
  | TempleDAppSendEncryptedMessagePayload
  | TempleNostrSignPayload;

/**
 * Messages
 */

export enum XTMessageType {
  // Notifications
  StateUpdated = 'XT_STATE_UPDATED',
  ConfirmationRequested = 'XT_CONFIRMATION_REQUESTED',
  ConfirmationExpired = 'XT_CONFIRMATION_EXPIRED',

  // Outgoing DAppNotifications
  DAppNetworkChanged = 'XT_DAPP_NETWORK_CHANGED',
  DAppAccountChanged = 'XT_DAPP_ACCOUNT_CHANGED',
  DAppPermissionRemoved = 'XT_DAPP_PERMISSION_REMOVED',
  DAppAccountRemoved = 'XT_DAPP_ACCOUNT_REMOVED',

  // Request-Response pairs
  GetStateRequest = 'XT_GET_STATE_REQUEST',
  GetStateResponse = 'XT_GET_STATE_RESPONSE',
  GetSignumTxKeysRequest = 'XT_GET_SIGNUM_TX_KEYS_REQUEST',
  GetSignumTxKeysResponse = 'XT_GET_SIGNUM_TX_KEYS_RESPONSE',
  NewWalletRequest = 'XT_NEW_WALLET_REQUEST',
  NewWalletResponse = 'XT_NEW_WALLET_RESPONSE',
  UnlockRequest = 'XT_UNLOCK_REQUEST',
  UnlockResponse = 'XT_UNLOCK_RESPONSE',
  LockRequest = 'XT_LOCK_REQUEST',
  LockResponse = 'XT_LOCK_RESPONSE',
  CreateAccountRequest = 'XT_CREATE_ACCOUNT_REQUEST',
  CreateAccountResponse = 'XT_CREATE_ACCOUNT_RESPONSE',
  RevealPublicKeyRequest = 'XT_REVEAL_PUBLIC_KEY_REQUEST',
  RevealPublicKeyResponse = 'XT_REVEAL_PUBLIC_KEY_RESPONSE',
  RevealNostrPrivateKeyRequest = 'XT_REVEAL_NOSTR_PRIVATE_KEY_REQUEST',
  RevealNostrPrivateKeyResponse = 'XT_REVEAL_NOSTR_PRIVATE_KEY_RESPONSE',
  RevealMnemonicRequest = 'XT_REVEAL_MNEMONIC_REQUEST',
  RevealMnemonicResponse = 'XT_REVEAL_MNEMONIC_RESPONSE',
  RemoveAccountRequest = 'XT_REMOVE_ACCOUNT_REQUEST',
  RemoveAccountResponse = 'XT_REMOVE_ACCOUNT_RESPONSE',
  ActivateAccountRequest = 'XT_SET_ACCOUNT_ACTIVATED_REQUEST',
  ActivateAccountResponse = 'XT_SET_ACCOUNT_ACTIVATED_RESPONSE',
  EditAccountRequest = 'XT_EDIT_ACCOUNT_REQUEST',
  EditAccountResponse = 'XT_EDIT_ACCOUNT_RESPONSE',
  ImportAccountRequest = 'XT_IMPORT_ACCOUNT_REQUEST',
  ImportAccountResponse = 'XT_IMPORT_ACCOUNT_RESPONSE',
  ImportMnemonicAccountRequest = 'XT_IMPORT_MNEMONIC_ACCOUNT_REQUEST',
  ImportMnemonicAccountResponse = 'XT_IMPORT_MNEMONIC_ACCOUNT_RESPONSE',
  ImportNostrAccountRequest = 'XT_IMPORT_NOSTR_ACCOUNT_REQUEST',
  ImportNostrAccountResponse = 'XT_IMPORT_NOSTR_ACCOUNT_RESPONSE',
  ImportFundraiserAccountRequest = 'XT_IMPORT_FUNDRAISER_ACCOUNT_REQUEST',
  ImportFundraiserAccountResponse = 'XT_IMPORT_FUNDRAISER_ACCOUNT_RESPONSE',
  ImportManagedKTAccountRequest = 'XT_IMPORT_MANAGED_KT_ACCOUNT_REQUEST',
  ImportManagedKTAccountResponse = 'XT_IMPORT_MANAGED_KT_ACCOUNT_RESPONSE',
  ImportWatchOnlyAccountRequest = 'XT_IMPORT_WATCH_ONLY_ACCOUNT_REQUEST',
  ImportWatchOnlyAccountResponse = 'XT_IMPORT_WATCH_ONLY_ACCOUNT_RESPONSE',
  CreateLedgerAccountRequest = 'XT_CREATE_LEDGER_ACCOUNT_REQUEST',
  CreateLedgerAccountResponse = 'XT_CREATE_LEDGER_ACCOUNT_RESPONSE',
  UpdateSettingsRequest = 'XT_UPDATE_SETTINGS_REQUEST',
  UpdateSettingsResponse = 'XT_UPDATE_SETTINGS_RESPONSE',
  OperationsRequest = 'XT_OPERATIONS_REQUEST',
  OperationsResponse = 'XT_OPERATIONS_RESPONSE',
  SignRequest = 'XT_SIGN_REQUEST',
  SignResponse = 'XT_SIGN_RESPONSE',
  ConfirmationRequest = 'XT_CONFIRMATION_REQUEST',
  ConfirmationResponse = 'XT_CONFIRMATION_RESPONSE',
  PageTextSelectedRequest = 'XT_PAGE_TEXT_SELECTED_REQUEST',
  PageTextSelectedResponse = 'XT_PAGE_TEXT_SELECTED_RESPONSE',
  PageRequest = 'PAGE_REQUEST',
  PageResponse = 'PAGE_RESPONSE',
  DAppGetPayloadRequest = 'XT_DAPP_GET_PAYLOAD_REQUEST',
  DAppGetPayloadResponse = 'XT_DAPP_GET_PAYLOAD_RESPONSE',
  DAppPermConfirmationRequest = 'XT_DAPP_PERM_CONFIRMATION_REQUEST',
  DAppPermConfirmationResponse = 'XT_DAPP_PERM_CONFIRMATION_RESPONSE',
  DAppOpsConfirmationRequest = 'XT_DAPP_OPS_CONFIRMATION_REQUEST',
  DAppOpsConfirmationResponse = 'XT_DAPP_OPS_CONFIRMATION_RESPONSE',
  DAppSignConfirmationRequest = 'XT_DAPP_SIGN_CONFIRMATION_REQUEST',
  DAppSignConfirmationResponse = 'XT_DAPP_SIGN_CONFIRMATION_RESPONSE',
  DAppSendEncryptedMessageConfirmationRequest = 'XT_DAPP_SEND_ENCRYPTED_MSG_CONFIRMATION_REQUEST',
  DAppSendEncryptedMessageConfirmationResponse = 'XT_DAPP_SEND_ENCRYPTED_MSG_CONFIRMATION_RESPONSE',
  DAppGetAllSessionsRequest = 'XT_DAPP_GET_ALL_SESSIONS_REQUEST',
  DAppGetAllSessionsResponse = 'XT_DAPP_GET_ALL_SESSIONS_RESPONSE',
  DAppRemoveSessionRequest = 'XT_DAPP_REMOVE_SESSION_REQUEST',
  DAppRemoveSessionResponse = 'XT_DAPP_REMOVE_SESSION_RESPONSE',
  DAppSelectNetworkRequest = 'XT_DAPP_SELECT_NETWORK_REQUEST',
  DAppSelectNetworkResponse = 'XT_DAPP_SELECT_NETWORK_RESPONSE',
  DAppSelectAccountRequest = 'XT_DAPP_SELECT_ACCOUNT_REQUEST',
  DAppSelectAccountResponse = 'XT_DAPP_SELECT_ACCOUNT_RESPONSE',
  NostrGetPublicKeyRequest = 'XT_NOSTR_PUBLIC_KEY_REQUEST',
  NostrGetPublicKeyResponse = 'XT_NOSTR_PUBLIC_KEY_RESPONSE'
}

export type TempleNotification =
  | TempleStateUpdated
  | TempleConfirmationRequested
  | TempleConfirmationExpired
  | TemplePermissionRemoved
  | TempleAccountRemoved
  | TempleNetworkChanged;

export type TempleRequest =
  | TempleGetStateRequest
  | TempleGetSignumTxKeysRequest
  | TempleNewWalletRequest
  | TempleUnlockRequest
  | TempleLockRequest
  | TempleCreateAccountRequest
  | TempleRevealPublicKeyRequest
  | TempleRevealNostrPrivateKeyRequest
  | TempleRevealMnemonicRequest
  | TempleActivateAccountRequest
  | TempleEditAccountRequest
  | TempleImportAccountRequest
  | TempleImportMnemonicAccountRequest
  | TempleImportNostrAccountRequest
  | TempleImportFundraiserAccountRequest
  | TempleImportManagedKTAccountRequest
  | TempleImportWatchOnlyAccountRequest
  | TempleCreateLedgerAccountRequest
  | TempleOperationsRequest
  | TempleSignRequest
  | TempleConfirmationRequest
  | TempleRemoveAccountRequest
  | TemplePageRequest
  | TempleDAppGetPayloadRequest
  | TempleDAppPermConfirmationRequest
  | TempleDAppOpsConfirmationRequest
  | TempleDAppSignConfirmationRequest
  | TempleDAppSendEncryptedMessageConfirmationRequest
  | TempleUpdateSettingsRequest
  | TempleGetAllDAppSessionsRequest
  | TempleRemoveDAppSessionRequest
  | TempleDAppSelectNetworkRequest
  | TempleDAppSelectAccountRequest
  | TemplePageTextSelectedRequest
  | TempleNostrGetPublicKeyRequest;

export type TempleResponse =
  | TempleGetStateResponse
  | TempleGetSignumTxKeysResponse
  | TempleNewWalletResponse
  | TempleUnlockResponse
  | TempleLockResponse
  | TempleCreateAccountResponse
  | TempleRevealPublicKeyResponse
  | TempleRevealNostrPrivateKeyResponse
  | TempleRevealMnemonicResponse
  | TempleActivateAccountResponse
  | TempleEditAccountResponse
  | TempleImportAccountResponse
  | TempleImportMnemonicAccountResponse
  | TempleImportNostrAccountResponse
  | TempleImportFundraiserAccountResponse
  | TempleImportManagedKTAccountResponse
  | TempleImportWatchOnlyAccountResponse
  | TempleCreateLedgerAccountResponse
  | TempleOperationsResponse
  | TempleSignResponse
  | TempleConfirmationResponse
  | TempleRemoveAccountResponse
  | TemplePageResponse
  | TempleDAppGetPayloadResponse
  | TempleDAppPermConfirmationResponse
  | TempleDAppOpsConfirmationResponse
  | TempleDAppSignConfirmationResponse
  | DAppSendEncryptedMessageConfirmationResponse
  | TempleUpdateSettingsResponse
  | TempleGetAllDAppSessionsResponse
  | TempleRemoveDAppSessionResponse
  | TempleDAppSelectNetworkResponse
  | TempleDAppSelectAccountResponse
  | TemplePageTextSelectedResponse
  | TempleNostrGetPublicKeyResponse;

export interface TempleMessageBase {
  type: XTMessageType;
}

export interface TempleStateUpdated extends TempleMessageBase {
  type: XTMessageType.StateUpdated;
}

export interface TempleConfirmationRequested extends TempleMessageBase {
  type: XTMessageType.ConfirmationRequested;
  id: string;
  payload: TempleConfirmationPayload;
}

export interface TempleConfirmationExpired extends TempleMessageBase {
  type: XTMessageType.ConfirmationExpired;
  id: string;
}

export interface TemplePermissionRemoved extends TempleMessageBase {
  type: XTMessageType.DAppPermissionRemoved;
  url: string;
}

export interface TempleAccountRemoved extends TempleMessageBase {
  type: XTMessageType.DAppAccountRemoved;
  accountId: string;
}

export interface TempleNetworkChanged extends TempleMessageBase {
  type: XTMessageType.DAppNetworkChanged;
  networkName: string;
  nodeHost: string;
}

export interface TempleGetStateRequest extends TempleMessageBase {
  type: XTMessageType.GetStateRequest;
}

export interface TempleGetStateResponse extends TempleMessageBase {
  type: XTMessageType.GetStateResponse;
  state: AppState;
}

export interface TempleGetSignumTxKeysRequest extends TempleMessageBase {
  type: XTMessageType.GetSignumTxKeysRequest;
  accountPublicKeyHash: string;
}

export interface TempleGetSignumTxKeysResponse extends TempleMessageBase {
  type: XTMessageType.GetSignumTxKeysResponse;
  publicKey: string;
  signingKey: string;
  p2pKey: string;
}

export interface TempleNewWalletRequest extends TempleMessageBase {
  type: XTMessageType.NewWalletRequest;
  password: string;
  mnemonic?: string;
}

export interface TempleNewWalletResponse extends TempleMessageBase {
  type: XTMessageType.NewWalletResponse;
}

export interface TempleUnlockRequest extends TempleMessageBase {
  type: XTMessageType.UnlockRequest;
  password: string;
}

export interface TempleUnlockResponse extends TempleMessageBase {
  type: XTMessageType.UnlockResponse;
}

export interface TempleLockRequest extends TempleMessageBase {
  type: XTMessageType.LockRequest;
}

export interface TempleLockResponse extends TempleMessageBase {
  type: XTMessageType.LockResponse;
}

export interface TempleCreateAccountRequest extends TempleMessageBase {
  type: XTMessageType.CreateAccountRequest;
  name?: string;
}

export interface TempleCreateAccountResponse extends TempleMessageBase {
  type: XTMessageType.CreateAccountResponse;
  mnemonic: string;
}

export interface TempleRevealPublicKeyRequest extends TempleMessageBase {
  type: XTMessageType.RevealPublicKeyRequest;
  accountPublicKeyHash: string;
}

export interface TempleRevealPublicKeyResponse extends TempleMessageBase {
  type: XTMessageType.RevealPublicKeyResponse;
  publicKey: string;
}

export interface TempleRevealNostrPrivateKeyRequest extends TempleMessageBase {
  type: XTMessageType.RevealNostrPrivateKeyRequest;
  accountPublicKey: string;
  password: string;
}

export interface TempleRevealNostrPrivateKeyResponse extends TempleMessageBase {
  type: XTMessageType.RevealNostrPrivateKeyResponse;
  privateKey: string;
}

export interface TempleRevealMnemonicRequest extends TempleMessageBase {
  type: XTMessageType.RevealMnemonicRequest;
  password: string;
}

export interface TempleRevealMnemonicResponse extends TempleMessageBase {
  type: XTMessageType.RevealMnemonicResponse;
  mnemonic: string;
}

export interface TempleRemoveAccountRequest extends TempleMessageBase {
  type: XTMessageType.RemoveAccountRequest;
  accountPublicKeyHash: string;
  password: string;
}

export interface TempleRemoveAccountResponse extends TempleMessageBase {
  type: XTMessageType.RemoveAccountResponse;
}

export interface TempleActivateAccountRequest extends TempleMessageBase {
  type: XTMessageType.ActivateAccountRequest;
  accountPublicKey: string;
}

export interface TempleActivateAccountResponse extends TempleMessageBase {
  type: XTMessageType.ActivateAccountResponse;
}

export interface TempleEditAccountRequest extends TempleMessageBase {
  type: XTMessageType.EditAccountRequest;
  accountPublicKey: string;
  name: string;
}

export interface TempleEditAccountResponse extends TempleMessageBase {
  type: XTMessageType.EditAccountResponse;
}

export interface TempleImportAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportAccountRequest;
  privateKey: string;
  encPassword?: string;
}

export interface TempleImportAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportAccountResponse;
}

export interface TempleImportMnemonicAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportMnemonicAccountRequest;
  mnemonic: string;
  name?: string;
  withNostr?: boolean;
}

export interface TempleImportMnemonicAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportMnemonicAccountResponse;
}

export interface TempleImportNostrAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportNostrAccountRequest;
  nsecOrHex: string;
  name?: string;
}

export interface TempleImportNostrAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportNostrAccountResponse;
}

export interface TempleImportFundraiserAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportFundraiserAccountRequest;
  email: string;
  password: string;
  mnemonic: string;
}

export interface TempleImportFundraiserAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportFundraiserAccountResponse;
}

export interface TempleImportManagedKTAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportManagedKTAccountRequest;
  address: string;
  chainId: string;
  owner: string;
}

export interface TempleImportManagedKTAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportManagedKTAccountResponse;
}

export interface TempleImportWatchOnlyAccountRequest extends TempleMessageBase {
  type: XTMessageType.ImportWatchOnlyAccountRequest;
  address: string;
  chainId?: string;
}

export interface TempleImportWatchOnlyAccountResponse extends TempleMessageBase {
  type: XTMessageType.ImportWatchOnlyAccountResponse;
}

export interface TempleCreateLedgerAccountRequest extends TempleMessageBase {
  type: XTMessageType.CreateLedgerAccountRequest;
  name: string;
  derivationPath?: string;
  derivationType?: DerivationType;
}

export interface TempleCreateLedgerAccountResponse extends TempleMessageBase {
  type: XTMessageType.CreateLedgerAccountResponse;
}

export interface TempleUpdateSettingsRequest extends TempleMessageBase {
  type: XTMessageType.UpdateSettingsRequest;
  settings: Partial<XTSettings>;
}

export interface TempleUpdateSettingsResponse extends TempleMessageBase {
  type: XTMessageType.UpdateSettingsResponse;
}

export interface TempleOperationsRequest extends TempleMessageBase {
  type: XTMessageType.OperationsRequest;
  id: string;
  sourcePkh: string;
  networkRpc: string;
  opParams: any[];
}

export interface TempleOperationsResponse extends TempleMessageBase {
  type: XTMessageType.OperationsResponse;
  opHash: string;
}

export interface TempleSignRequest extends TempleMessageBase {
  type: XTMessageType.SignRequest;
  id: string;
  sourcePkh: string;
  bytes: string;
  watermark?: string;
}

export interface TempleSignResponse extends TempleMessageBase {
  type: XTMessageType.SignResponse;
  result: any;
}

export interface TempleConfirmationRequest extends TempleMessageBase {
  type: XTMessageType.ConfirmationRequest;
  id: string;
  confirmed: boolean;
  modifiedTotalFee?: number;
  modifiedStorageLimit?: number;
}

export interface TempleConfirmationResponse extends TempleMessageBase {
  type: XTMessageType.ConfirmationResponse;
}

export interface TemplePageTextSelectedRequest extends TempleMessageBase {
  type: XTMessageType.PageTextSelectedRequest;
  origin: string;
  selected: string;
}

export interface TemplePageRequest extends TempleMessageBase {
  type: XTMessageType.PageRequest;
  origin: string;
  payload: any;
  beacon?: boolean;
  encrypted?: boolean;
}

export interface TemplePageResponse extends TempleMessageBase {
  type: XTMessageType.PageResponse;
  payload: any;
  encrypted?: boolean;
}

export interface TemplePageTextSelectedResponse extends TempleMessageBase {
  type: XTMessageType.PageTextSelectedResponse;
}

export interface TempleDAppGetPayloadRequest extends TempleMessageBase {
  type: XTMessageType.DAppGetPayloadRequest;
  id: string;
}

export interface TempleDAppGetPayloadResponse extends TempleMessageBase {
  type: XTMessageType.DAppGetPayloadResponse;
  payload: TempleDAppPayload;
}

export interface TempleDAppPermConfirmationRequest extends TempleMessageBase {
  type: XTMessageType.DAppPermConfirmationRequest;
  id: string;
  confirmed: boolean;
  accountPublicKey: string;
  accountPublicKeyHash: string;
}

export interface TempleDAppPermConfirmationResponse extends TempleMessageBase {
  type: XTMessageType.DAppPermConfirmationResponse;
}

export interface TempleDAppOpsConfirmationRequest extends TempleMessageBase {
  type: XTMessageType.DAppOpsConfirmationRequest;
  id: string;
  confirmed: boolean;
  modifiedTotalFee?: number;
  modifiedStorageLimit?: number;
}

export interface TempleDAppOpsConfirmationResponse extends TempleMessageBase {
  type: XTMessageType.DAppOpsConfirmationResponse;
}

export interface TempleDAppSignConfirmationRequest extends TempleMessageBase {
  type: XTMessageType.DAppSignConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface TempleDAppSignConfirmationResponse extends TempleMessageBase {
  type: XTMessageType.DAppSignConfirmationResponse;
}

export interface TempleDAppSendEncryptedMessageConfirmationRequest extends TempleMessageBase {
  type: XTMessageType.DAppSendEncryptedMessageConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface DAppSendEncryptedMessageConfirmationResponse extends TempleMessageBase {
  type: XTMessageType.DAppSendEncryptedMessageConfirmationResponse;
}

export interface TempleGetAllDAppSessionsRequest extends TempleMessageBase {
  type: XTMessageType.DAppGetAllSessionsRequest;
}

export interface TempleGetAllDAppSessionsResponse extends TempleMessageBase {
  type: XTMessageType.DAppGetAllSessionsResponse;
  sessions: DAppSessions;
}

export interface TempleRemoveDAppSessionRequest extends TempleMessageBase {
  type: XTMessageType.DAppRemoveSessionRequest;
  origin: string;
}

export interface TempleRemoveDAppSessionResponse extends TempleMessageBase {
  type: XTMessageType.DAppRemoveSessionResponse;
  sessions: DAppSessions;
}

export interface TempleDAppSelectNetworkRequest extends TempleMessageBase {
  type: XTMessageType.DAppSelectNetworkRequest;
  network: Network;
}

export interface TempleDAppSelectNetworkResponse extends TempleMessageBase {
  type: XTMessageType.DAppSelectNetworkResponse;
}

export interface TempleDAppSelectAccountRequest extends TempleMessageBase {
  type: XTMessageType.DAppSelectAccountRequest;
  account: XTAccount;
}

export interface TempleDAppSelectAccountResponse extends TempleMessageBase {
  type: XTMessageType.DAppSelectAccountResponse;
}

export interface TempleNostrGetPublicKeyRequest extends TempleMessageBase {
  type: XTMessageType.NostrGetPublicKeyRequest;
}

export interface TempleNostrGetPublicKeyResponse extends TempleMessageBase {
  type: XTMessageType.NostrGetPublicKeyResponse;
  publicKey: string;
}

export type OperationsPreview = any[] | { branch: string; contents: any[] };
