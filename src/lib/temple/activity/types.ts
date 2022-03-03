export enum TransactionItemType {
  TransferTo,
  TransferFrom,
  Interaction,
  Origination,
  Other
}

export type TransactionItem = TransferFromItem | TransferToItem | InteractionItem | OriginationItem | OtherItem;

export interface OpStackItemBase {
  type: TransactionItemType;
}

export interface TransferFromItem extends OpStackItemBase {
  type: TransactionItemType.TransferFrom;
  from: string;
}

export interface TransferToItem extends OpStackItemBase {
  type: TransactionItemType.TransferTo;
  to: string;
}

export interface InteractionItem extends OpStackItemBase {
  type: TransactionItemType.Interaction;
  with: string;
  entrypoint: string;
}

export interface OriginationItem extends OpStackItemBase {
  type: TransactionItemType.Origination;
  contract?: string;
}

export interface OtherItem extends OpStackItemBase {
  type: TransactionItemType.Other;
  name: string;
}
