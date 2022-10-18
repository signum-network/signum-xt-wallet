import Dexie from 'dexie';

export enum Table {
  AccountTokens = 'accountTokens',
  Operations = 'operations',
  SyncTimes = 'syncTimes'
}

// TODO: adjust for Signum

export const db = new Dexie('signum-xt-wallet');
db.version(1).stores({
  [Table.Operations]: indexes('&hash', 'network', '*members', '*assetIds', 'addedAt', '[network+addedAt]'),
  [Table.SyncTimes]: indexes('[service+chainId+address]')
});
db.version(2).stores({
  [Table.AccountTokens]: indexes('', '[network+account+type]', '[chainId+type]')
});

export const waitFor = Dexie.waitFor;

export const accountTokens = db.table<IAccountToken, string>(Table.AccountTokens);
// export const operations = db.table<IOperation, string>(Table.Operations);
// export const syncTimes = db.table<ISyncTime, string>(Table.SyncTimes);

export function toAccountTokenKey(networkName: string, account: string, tokenSlug: string) {
  return [networkName, account, tokenSlug].join('_');
}

export enum ITokenType {
  Fungible,
  Collectible
}

export enum ITokenStatus {
  Idle,
  Enabled,
  Disabled,
  Removed
}

export interface IAccountToken {
  type: ITokenType;
  network: string;
  account: string;
  tokenId: string;
  status: ITokenStatus;
  addedAt: number;
  latestBalance?: string;
  latestUSDBalance?: string;
}

// export interface IOperation {
//   hash: string;
//   network: string;
//   members: string[];
//   assetIds: string[];
//   addedAt: number; // timestamp
//   data: IOperationData;
// }
//
// export type IOperationData = AtLeastOne<{
//   localGroup: OperationContentsAndResult[];
//   tzktGroup: TzktOperation[];
//   // bcdTokenTransfers: BcdTokenTransfer[];
// }>;
//
// export interface ISyncTime {
//   service: 'tzkt' | 'bcd';
//   network: string;
//   address: string;
//   higherTimestamp: number;
//   lowerTimestamp: number;
// }

function indexes(...items: string[]) {
  return items.join(',');
}

// type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
