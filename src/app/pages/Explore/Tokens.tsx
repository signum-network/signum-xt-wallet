import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { cache } from 'swr';
import { useDebounce } from 'use-debounce';

import Money from 'app/atoms/Money';
import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as LoadAllIcon } from 'app/icons/entrance.svg';
import { ReactComponent as RemoveAllIcon } from 'app/icons/bin.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import AssetIcon from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import SearchAssetField from 'app/templates/SearchAssetField';
import { t, T } from 'lib/i18n/react';
import {
  useAccount,
  useBalanceSWRKey,
  getAssetSymbol,
  useAllTokensBaseMetadata,
  searchAssets,
  useSignumAssetMetadata,
  FEATURED_TOKEN_IDS,
  useNetwork,
  useFungibleTokens,
  getAssetName,
  removeToken,
  useTokensMetadata,
  useSignum
} from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { useConfirm } from 'lib/ui/dialog';
import { Link, navigate } from 'lib/woozie';

import { AssetsSelectors } from './Assets.selectors';
import styles from './Tokens.module.css';

const Tokens: FC = () => {
  const network = useNetwork();
  const account = useAccount();
  const confirm = useConfirm();
  const signum = useSignum();
  const { fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();
  const address = account.publicKey;
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { data: tokens = [], revalidate } = useFungibleTokens(network.networkName, address);
  const tokenIds = useMemo(() => [...FEATURED_TOKEN_IDS, ...tokens.map(({ tokenId }) => tokenId)], [tokens]);

  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fetchingTokens, setFetchingTokens] = useState(false);

  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredTokens = useMemo(
    () => searchAssets(searchValueDebounced, tokenIds, allTokensBaseMetadata),
    [searchValueDebounced, tokenIds, allTokensBaseMetadata]
  );

  const searchValueExist = Boolean(searchValue);
  const activeAsset = useMemo(() => {
    return searchFocused && searchValueExist && filteredTokens[activeIndex] ? filteredTokens[activeIndex] : null;
  }, [filteredTokens, searchFocused, searchValueExist, activeIndex]);

  const fetchAllAccountsTokenMetadata = useCallback(async () => {
    try {
      setFetchingTokens(true);
      const { assetBalances } = await signum.account.getAccount({ accountId: account.accountId });
      for (let { asset: tokenId } of assetBalances) {
        const { base: metadata } = await fetchMetadata(tokenId);
        await setTokensBaseMetadata({ [tokenId]: metadata });
        const { networkName } = network;
        await Repo.accountTokens.put(
          {
            type: Repo.ITokenType.Fungible,
            network: networkName,
            account: account.publicKey,
            tokenId,
            status: Repo.ITokenStatus.Enabled,
            addedAt: Date.now()
          },
          Repo.toAccountTokenKey(networkName, account.publicKey, tokenId)
        );
        await revalidate();
      }
    } catch (e) {
      console.log(e);
    } finally {
      setFetchingTokens(false);
    }
  }, [signum.account, account.accountId, account.publicKey, fetchMetadata, setTokensBaseMetadata, network, revalidate]);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredTokens.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredTokens.length]);

  const handleSearchFieldFocus = useCallback(() => {
    setSearchFocused(true);
  }, [setSearchFocused]);

  const handleSearchFieldBlur = useCallback(() => {
    setSearchFocused(false);
  }, [setSearchFocused]);

  useEffect(() => {
    if (!activeAsset) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          navigate(toExploreAssetLink(activeAsset));
          break;

        case 'ArrowDown':
          setActiveIndex(i => i + 1);
          break;

        case 'ArrowUp':
          setActiveIndex(i => (i > 0 ? i - 1 : 0));
          break;
      }
    };

    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [activeAsset, setActiveIndex]);

  const handleTokenRemove = useCallback(
    async (tokenId: string) => {
      try {
        const confirmed = await confirm({
          title: t('deleteTokenConfirm')
        });
        if (!confirmed) return;
        await removeToken(network.networkName, address, tokenId);
        await revalidate();
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [network.networkName, address, confirm, revalidate]
  );

  const handleLoadAllTokensWithBalance = async () => {
    await fetchAllAccountsTokenMetadata();
  };

  const handleRemoveAllTokens = async () => {
    const confirmed = await confirm({
      title: t('deleteAllTokensConfirm')
    });
    if (!confirmed) return;

    await Promise.all(tokens.map(({ tokenId }) => removeToken(network.networkName, address, tokenId)));
    await revalidate();
  };

  return (
    <div className={classNames('w-full max-w-sm mx-auto')}>
      <div className="mt-1 mb-3 w-full flex items-stretch justify-between">
        <Link
          to="/add-token"
          className={classNames(
            'flex-shrink-0',
            'px-3 py-1',
            'rounded overflow-hidden',
            'flex items-center',
            'text-gray-600 text-sm',
            'transition ease-in-out duration-200',
            'hover:bg-gray-100',
            'opacity-75 hover:opacity-100 focus:opacity-100'
          )}
        >
          <AddToListIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
          <T id="addToken" />
        </Link>

        {!fetchingTokens && tokens.length === 0 && (
          <button
            className={classNames(
              'flex-shrink-0',
              'px-3 py-1',
              'rounded overflow-hidden',
              'flex items-center',
              'text-gray-600 text-sm',
              'transition ease-in-out duration-200',
              'hover:bg-gray-100',
              'opacity-75 hover:opacity-100 focus:opacity-100',
              fetchingTokens ? 'animate-pulse cursor-not-allowed' : ''
            )}
            onClick={handleLoadAllTokensWithBalance}
            disabled={fetchingTokens}
          >
            <LoadAllIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
            <T id="autoLoadTokens" />
          </button>
        )}

        {!fetchingTokens && tokens.length > 0 && (
          <button
            className={classNames(
              'flex-shrink-0',
              'px-3 py-1',
              'rounded overflow-hidden',
              'flex items-center',
              'text-gray-600 text-sm',
              'transition ease-in-out duration-200',
              'hover:bg-gray-100',
              'opacity-75 hover:opacity-100 focus:opacity-100',
              fetchingTokens ? 'animate-pulse cursor-not-allowed' : ''
            )}
            onClick={handleRemoveAllTokens}
            disabled={fetchingTokens}
          >
            <RemoveAllIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
            <T id="removeAllAddedTokens" />
          </button>
        )}
      </div>
      {tokens.length > 5 && (
        <div className="relative mt-1 mb-3 w-full">
          <SearchAssetField
            value={searchValue}
            onValueChange={setSearchValue}
            onFocus={handleSearchFieldFocus}
            onBlur={handleSearchFieldBlur}
          />
          <div className="absolute top-0 right-0 text-gray-500 text-xs leading-tight">{filteredTokens.length}/{tokens.length}</div>
        </div>
      )}

      {filteredTokens.length > 0 ? (
        <div
          className={classNames(
            'w-full overflow-hidden',
            'border rounded-md',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          <TransitionGroup key={network.networkName}>
            {filteredTokens.map((tokenId, i, arr) => {
              const last = i === arr.length - 1;
              const active = activeAsset ? tokenId === activeAsset : false;

              return (
                <CSSTransition
                  key={tokenId}
                  timeout={300}
                  classNames={{
                    enter: 'opacity-0',
                    enterActive: classNames('opacity-100', 'transition ease-out duration-300'),
                    exit: classNames('opacity-0', 'transition ease-in duration-300')
                  }}
                  unmountOnExit
                >
                  <ListItem
                    tokenId={tokenId}
                    last={last}
                    active={active}
                    accountId={account.accountId}
                    onRemove={handleTokenRemove}
                  />
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        </div>
      ) : (
        <div className={classNames('my-8', 'flex flex-col items-center justify-center', 'text-gray-500')}>
          <p className={classNames('mb-2', 'flex items-center justify-center', 'text-gray-600 text-base font-light')}>
            {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

            <span>
              <T id="noAssetsFound" />
            </span>
          </p>

          <p className={classNames('text-center text-xs font-light')}>
            <T
              id="ifYouDontSeeYourAsset"
              substitutions={[
                <b>
                  <T id="addToken" />
                </b>
              ]}
            />
          </p>
        </div>
      )}
    </div>
  );
};

export default Tokens;

type ListItemProps = {
  tokenId: string;
  last: boolean;
  active: boolean;
  accountId: string;
  onRemove: (assetSlug: string) => void;
};

const ListItem: FC<ListItemProps> = ({ tokenId, last, active, accountId, onRemove }) => {
  const metadata = useSignumAssetMetadata(tokenId);
  const balanceSWRKey = useBalanceSWRKey(tokenId, accountId);
  const balanceAlreadyLoaded = useMemo(() => cache.has(balanceSWRKey), [balanceSWRKey]);
  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(balanceAlreadyLoaded);

  useEffect(() => {
    const el = toDisplayRef.current;
    if (!displayed && 'IntersectionObserver' in window && el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setDisplayed(true);
          }
        },
        { rootMargin: '0px' }
      );

      observer.observe(el);
      return () => {
        observer.unobserve(el);
      };
    }
    return undefined;
  }, [displayed, setDisplayed]);

  return (
    <Link
      to={toExploreAssetLink(tokenId)}
      className={classNames(
        'relative',
        'block w-full',
        'overflow-hidden',
        !last && 'border-b border-gray-200',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100',
        'flex items-center p-4',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none'
      )}
      testID={AssetsSelectors.AssetItemButton}
      testIDProperties={{ key: tokenId }}
    >
      <div
        className={classNames(
          'absolute top-0 right-0',
          'p-1 rounded-full',
          'text-gray-400 hover:text-gray-600',
          'hover:bg-black hover:bg-opacity-5',
          'transition ease-in-out duration-200'
        )}
        onClick={evt => {
          evt.preventDefault();
          onRemove(tokenId);
        }}
      >
        <CloseIcon className="w-auto h-4 stroke-current stroke-2" title={t('delete')} />
      </div>

      <div ref={toDisplayRef} className="w-full relative top-[4px]">
        <div className="flex flex-row justify-between items-center w-full mb-1">
          <div className="flex flex-row items-center">
            <AssetIcon metadata={metadata} size={40} className="mr-2 flex-shrink-0" />
            <div>
              <div className={classNames(styles['tokenSymbol'])}>{getAssetSymbol(metadata)}</div>
              <div className={classNames('text-xs font-normal text-gray-700 truncate w-auto flex-1')}>
                {getAssetName(metadata)}
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Balance accountId={accountId} tokenId={tokenId} displayed={displayed}>
              {balance => (
                <div className="text-base font-medium text-gray-800">
                  <Money smallFractionFont={false}>{balance}</Money>
                </div>
              )}
            </Balance>
          </div>
        </div>
        <div className="flex justify-between w-full mb-1"></div>
      </div>
    </Link>
  );
};

function toExploreAssetLink(key: string) {
  return `/explore/${key}`;
}
