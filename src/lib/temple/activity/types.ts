export enum TransactionItemType {
  TransferTo,
  TransferFrom,
  MessageTo,
  MessageFrom,
  Interaction,
  Origination,
  SelfUpdate,
  BuyOrder,
  SellOrder,
  // Distribution,
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
  | BuyOrderItem
  | SellOrderItem
  // | DistributionItem
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
  amount?: string;
}

export interface BuyOrderItem extends TxItemBase {
  type: TransactionItemType.BuyOrder;
  from: string;
  fulfilled?: boolean;
}

export interface SellOrderItem extends TxItemBase {
  type: TransactionItemType.SellOrder;
  to: string;
  fulfilled?: boolean;
}

// export interface DistributionItem extends TxItemBase {
//   type: TransactionItemType.Distribution;
// }

export interface OtherItem extends TxItemBase {
  type: TransactionItemType.Other;
  prefix: string;
  name: string;
}
