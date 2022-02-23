import { AssetMetadata, DetailedAssetMetdata } from './types';
// TODO: implement once we need it
export async function fetchTokenMetadata(
  tezos: any,
  assetSlug: string
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  // TODO: signum implementation if needed
  throw new NotFoundTokenMetadata();
}

export class NotFoundTokenMetadata extends Error {
  name = 'NotFoundTokenMetadata';
  message = "Metadata for token doesn't found";
}
