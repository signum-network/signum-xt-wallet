import { useCallback, useEffect, useMemo, useRef } from 'react';

import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import Fuse from 'fuse.js';
import useForceUpdate from 'use-force-update';
import browser from 'webextension-polyfill';

import { createQueue } from 'lib/queue';
import { useRetryableSWR } from 'lib/swr';
import {
  useTezos,
  usePassiveStorage,
  isTezAsset,
  AssetMetadata,
  fetchTokenMetadata,
  TEZOS_METADATA,
  SIGNA_METADATA,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  onStorageChanged,
  putToStorage,
  fetchFromStorage,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  DetailedAssetMetdata,
  useNetwork,
  SIGNA_TESTNET_METADATA,
  NetworkName,
  useSignum,
  SIGNA_TOKEN_ID
} from 'lib/temple/front';

export const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

export function useDisplayedFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(
    ['displayed-fungible-tokens', chainId, account],
    () => fetchDisplayedFungibleTokens(chainId, account),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 1_000
    }
  );
}

export function useFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(['fungible-tokens', chainId, account], () => fetchFungibleTokens(chainId, account), {
    revalidateOnMount: true,
    refreshInterval: 20_000,
    dedupingInterval: 5_000
  });
}

export function useCollectibleTokens(chainId: string, account: string, isDisplayed: boolean) {
  return useRetryableSWR(
    ['collectible-tokens', chainId, account, isDisplayed],
    () => fetchCollectibleTokens(chainId, account, isDisplayed),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 5_000
    }
  );
}

export function useAllKnownFungibleTokenSlugs(chainId: string) {
  return useRetryableSWR(['all-known-fungible-token-slugs', chainId], () => fetchAllKnownFungibleTokenSlugs(chainId), {
    revalidateOnMount: true,
    refreshInterval: 60_000,
    dedupingInterval: 10_000
  });
}

export function useAllKnownCollectibleTokenSlugs(chainId: string) {
  return useRetryableSWR(
    ['all-known-collectible-token-slugs', chainId],
    () => fetchAllKnownCollectibleTokenSlugs(chainId),
    {
      revalidateOnMount: true,
      refreshInterval: 60_000,
      dedupingInterval: 10_000
    }
  );
}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useSignumAssetMetadata(tokenId: string = SIGNA_TOKEN_ID): AssetMetadata {
  const network = useNetwork();
  const forceUpdate = useForceUpdate();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();

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

// FIXME: remove this....
export function useAssetMetadata(slug: string) {
  const tezos = useTezos();
  const forceUpdate = useForceUpdate();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata } =
    useTokensMetadata();

  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        if (!deepEqual(newValue[slug], allTokensBaseMetadataRef.current[slug])) {
          forceUpdate();
        }
      }),
    [slug, allTokensBaseMetadataRef, forceUpdate]
  );

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = allTokensBaseMetadataRef.current[slug] ?? null;
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist && !autoFetchMetadataFails.has(slug)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(slug))
        .then(metadata =>
          Promise.all([
            setTokensBaseMetadata({ [slug]: metadata.base })
            // setTokensDetailedMetadata({ [slug]: metadata.detailed })
          ])
        )
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, exist, fetchMetadata, setTokensBaseMetadata]);

  // Tezos
  if (tezAsset) {
    return TEZOS_METADATA;
  }

  return tokenMetadata;
}

const defaultAllTokensBaseMetadata = {};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = usePassiveStorage<Record<string, AssetMetadata>>(
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
  assetSlugs: string[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return assetSlugs;

  const fuse = new Fuse(
    assetSlugs.map(slug => ({
      slug,
      metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug]
    })),
    {
      keys: [
        { name: 'metadata.name', weight: 0.9 },
        { name: 'metadata.symbol', weight: 0.7 },
        { name: 'slug', weight: 0.3 }
      ],
      threshold: 1
    }
  );

  return fuse.search(searchValue).map(({ item: { slug } }) => slug);
}

function getDetailedMetadataStorageKey(slug: string) {
  return `detailed_asset_metadata_${slug}`;
}

function mapObjectKeys<T extends Record<string, any>>(obj: T, predicate: (key: string) => string): T {
  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    newObj[predicate(key)] = obj[key];
  }

  return newObj as T;
}
