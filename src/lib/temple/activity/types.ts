export enum TransactionItemType {
  TransferTo,
  TransferFrom,
  MessageTo,
  MessageFrom,
  Interaction,
  Origination,
  SelfUpdate,
  Other
}

export type TransactionItem =
  | TransferFromItem
  | TransferToItem
  | MessageToItem
  | MessageFromItem
  | InteractionItem
  | OriginationItem
  | SelfUpdateItem
  | OtherItem;

export interface TxItemBase {
  type: TransactionItemType;
}

export interface TransferFromItem extends TxItemBase {
  type: TransactionItemType.TransferFrom;
  from: string;
}

export interface TransferToItem extends TxItemBase {
  type: TransactionItemType.TransferTo;
  to: string;
}

export interface MessageFromItem extends TxItemBase {
  type: TransactionItemType.MessageFrom;
  from: string;
  isEncrypted: boolean;
}

export interface MessageToItem extends TxItemBase {
  type: TransactionItemType.MessageTo;
  to: string;
  isEncrypted: boolean;
}

export interface InteractionItem extends TxItemBase {
  type: TransactionItemType.Interaction;
  contract: string;
}

export interface OriginationItem extends TxItemBase {
  type: TransactionItemType.Origination;
  contract: string;
}

export interface SelfUpdateItem extends TxItemBase {
  type: TransactionItemType.SelfUpdate;
  prefix: string;
  i18nKey: string;
}

export interface OtherItem extends TxItemBase {
  type: TransactionItemType.Other;
  prefix: string;
  name: string;
}
