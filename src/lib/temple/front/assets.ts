import { useCallback, useEffect, useRef } from 'react';

import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import useForceUpdate from 'use-force-update';

import { createQueue } from 'lib/queue';
import { useRetryableSWR } from 'lib/swr';
import {
  useSharedStorage,
  AssetMetadata,
  fetchTokenMetadata,
  SIGNA_METADATA,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  onStorageChanged,
  putToStorage,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  useNetwork,
  SIGNA_TESTNET_METADATA,
  NetworkName,
  useSignum,
  SIGNA_TOKEN_ID
} from 'lib/temple/front';

export const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

export function useFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(['fungible-tokens', chainId, account], () => fetchFungibleTokens(chainId, account), {
    revalidateOnMount: true,
    refreshInterval: 20_000,
    dedupingInterval: 5_000
  });
}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useSignumAssetMetadata(tokenId: string = SIGNA_TOKEN_ID) {
  const network = useNetwork();
  const forceUpdate = useForceUpdate();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();

  // TODO: refactor this code.... it can cause some issues in prod build.
  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        if (!deepEqual(newValue[tokenId], allTokensBaseMetadataRef.current[tokenId])) {
          forceUpdate();
        }
      }),
    [tokenId, allTokensBaseMetadataRef, forceUpdate]
  );

  const tokenMetadata = allTokensBaseMetadataRef.current[tokenId] ?? null;
  const exist = Boolean(tokenMetadata);

  useEffect(() => {
    if (tokenId !== SIGNA_TOKEN_ID && !exist && !autoFetchMetadataFails.has(tokenId)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(tokenId))
        .then(metadata => Promise.all([setTokensBaseMetadata({ [tokenId]: metadata.base })]))
        .catch(() => autoFetchMetadataFails.add(tokenId));
    }
  }, [tokenId, exist, fetchMetadata, setTokensBaseMetadata]);

  if (tokenId === SIGNA_TOKEN_ID) {
    return network.networkName === NetworkName.Mainnet ? SIGNA_METADATA : SIGNA_TESTNET_METADATA;
  }

  return tokenMetadata;
}

const defaultAllTokensBaseMetadata = {};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = useSharedStorage<Record<string, AssetMetadata>>(
    ALL_TOKENS_BASE_METADATA_STORAGE_KEY,
    defaultAllTokensBaseMetadata
  );

  const allTokensBaseMetadataRef = useRef(initialAllTokensBaseMetadata);

  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        allTokensBaseMetadataRef.current = newValue;
      }),
    []
  );
  const signum = useSignum();
  const signumRef = useRef(signum);
  useEffect(() => {
    signumRef.current = signum;
  }, [signum]);

  const fetchMetadata = useCallback((tokenId: string) => fetchTokenMetadata(signumRef.current, tokenId), []);

  const setTokensBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() =>
        putToStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, {
          ...allTokensBaseMetadataRef.current,
          ...toSet
        })
      ),
    []
  );

  return {
    allTokensBaseMetadataRef,
    fetchMetadata,
    setTokensBaseMetadata
  };
});

export function useAllTokensBaseMetadata() {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const forceUpdate = useForceUpdate();

  useEffect(() => onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, forceUpdate), [forceUpdate]);

  return allTokensBaseMetadataRef.current;
}

export function searchAssets(
  searchValue: string,
  tokenIds: string[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return tokenIds;

  const matches = (s: string, t: string) => s.toLowerCase().indexOf(t) !== -1;

  const term = searchValue.toLowerCase();
  return tokenIds.filter(id => {
    const { description, name, symbol } = allTokensBaseMetadata[id];
    return matches(description, term) || matches(name, term) || matches(symbol, term);
  });
}
