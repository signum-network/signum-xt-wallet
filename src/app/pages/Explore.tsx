import React, { FC, FunctionComponent, ReactNode, Suspense, SVGProps, useLayoutEffect, useMemo } from 'react';

import classNames from 'clsx';
import { Props as TippyProps } from 'tippy.js';

import Spinner from 'app/atoms/Spinner';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as ExploreIcon } from 'app/icons/explore.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send-alt.svg';
import PageLayout from 'app/layouts/PageLayout';
import Tokens from 'app/pages/Explore/Tokens';
import Activity from 'app/templates/SignumActivity/Activity';
import TokenActivity from 'app/templates/SignumActivity/TokenActivity';
import P2PMessages from 'app/templates/SignumP2PMessages/P2PMessages';
import { T, t } from 'lib/i18n/react';
import { getAssetSymbol, XTAccountType, useAccount, useSignumAssetMetadata, SIGNA_TOKEN_ID } from 'lib/temple/front';
import { useNetworkIsReachable } from 'lib/ui/useNetworkIsReachable';
import useTippy from 'lib/ui/useTippy';
import { HistoryAction, Link, navigate, useLocation } from 'lib/woozie';

import Alert from '../atoms/Alert';
import { ExploreSelectors } from './Explore.selectors';
import { ActivationSection } from './Explore/ActivationSection';
import AddressChip from './Explore/AddressChip';
import EditableTitle from './Explore/EditableTitle';
import MainBanner from './Explore/MainBanner';
import { useOnboardingProgress } from './Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from './Onboarding/Onboarding';

type ExploreProps = {
  tokenId?: string | null;
};

const Explore: FC<ExploreProps> = ({ tokenId }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const { onboardingCompleted } = useOnboardingProgress();
  const networkIsReachable = useNetworkIsReachable();
  const account = useAccount();
  const { search } = useLocation();
  const token = tokenId ?? SIGNA_TOKEN_ID;
  const assetMetadata = useSignumAssetMetadata(token);

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (tokenId && usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, tokenId, search]);

  const canSend = account.type !== XTAccountType.WatchOnly;
  const fullpageClassName = fullPage ? 'mb-10' : 'mb-6';
  const sendLink = tokenId ? `/send/${tokenId}` : '/send';

  return onboardingCompleted ? (
    <PageLayout
      pageTitle={
        <>
          <ExploreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="explore" />
          {tokenId && (
            <>
              <ChevronRightIcon className="w-auto h-4 mx-px stroke-current opacity-75" />
              <span className="font-normal">{getAssetSymbol(assetMetadata)}</span>
            </>
          )}
        </>
      }
      attention={true}
    >
      {fullPage && (
        <>
          <EditableTitle />
          <hr className="mb-6" />
        </>
      )}

      <div className={classNames('flex flex-col items-center', fullpageClassName)}>
        {!networkIsReachable && (
          <div className="w-full justify-center items-center mb-4 mx-auto max-w-sm">
            <Alert type="error" title={t('cantConnectToNetwork')} description={t('cantConnectToNetworkHint')} />
          </div>
        )}
        <AddressChip account={account} className="mb-6" />

        <MainBanner accountId={account.accountId} tokenId={token} />

        <div className="flex justify-around mx-auto w-full max-w-sm mt-6 px-8">
          <ActionButton label={<T id="receive" />} Icon={ReceiveIcon} href="/receive" />
          <ActionButton
            label={<T id="send" />}
            Icon={SendIcon}
            href={sendLink}
            disabled={!canSend}
            tippyProps={{
              trigger: 'mouseenter',
              hideOnClick: false,
              content: t('disabledForWatchOnlyAccount'),
              animation: 'shift-away-subtle'
            }}
          />
        </div>
        <ActivationSection />
      </div>

      <SecondarySection tokenId={tokenId} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
};

export default Explore;

type ActionButtonProps = {
  label: React.ReactNode;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  href: string;
  disabled?: boolean;
  tippyProps?: Partial<TippyProps>;
};

const ActionButton: FC<ActionButtonProps> = ({ label, Icon, href, disabled, tippyProps = {} }) => {
  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonButtonProps = useMemo(
    () => ({
      className: `flex flex-col items-center`,
      type: 'button' as const,
      children: (
        <>
          <div
            className={classNames(
              disabled ? 'bg-blue-300' : 'bg-blue-500',
              'rounded mb-1 flex items-center text-white'
            )}
            style={{ padding: '0 0.625rem', height: '2.75rem' }}
          >
            <Icon className="w-6 h-auto stroke-current stroke-2" />
          </div>
          <span className={classNames('text-xs text-center', disabled ? 'text-blue-300' : 'text-blue-500')}>
            {label}
          </span>
        </>
      )
    }),
    [disabled, Icon, label]
  );
  return disabled ? <button ref={buttonRef} {...commonButtonProps} /> : <Link to={href} {...commonButtonProps} />;
};

type ActivityTabProps = {
  tokenId?: string;
};

const ActivityTab: FC<ActivityTabProps> = ({ tokenId = SIGNA_TOKEN_ID }) => {
  const account = useAccount();

  return (
    <SuspenseContainer whileMessage={t('operationHistoryWhileMessage')}>
      {tokenId === SIGNA_TOKEN_ID ? (
        <Activity publicKey={account.publicKey} />
      ) : (
        <TokenActivity publicKey={account.publicKey} tokenId={tokenId} />
      )}
    </SuspenseContainer>
  );
};

const P2PMessagesTab: FC = () => {
  const account = useAccount();

  return (
    <SuspenseContainer whileMessage={t('operationHistoryWhileMessage')}>
      <P2PMessages publicKey={account.publicKey} />
    </SuspenseContainer>
  );
};

function useTabSlug() {
  const { search } = useLocation();
  const tabSlug = useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get('tab');
  }, [search]);
  return useMemo(() => tabSlug, [tabSlug]);
}

type SecondarySectionProps = {
  tokenId?: string | null;
  className?: string;
};

const SecondarySection: FC<SecondarySectionProps> = ({ tokenId, className }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

  const tabs = useMemo<
    {
      slug: string;
      title: string;
      Component: FC;
      testID: string;
    }[]
  >(() => {
    if (!tokenId) {
      return [
        // {
        //   slug: 'collectibles',
        //   title: t('collectibles'),
        //   Component: CollectiblesList,
        //   testID: ExploreSelectors.CollectiblesTab
        // },
        {
          slug: 'activity',
          title: t('activity'),
          Component: ActivityTab,
          testID: ExploreSelectors.ActivityTab
        },
        {
          slug: 'messages',
          title: t('messages'),
          Component: P2PMessagesTab,
          testID: ExploreSelectors.MessagesTab
        },
        {
          slug: 'tokens',
          title: t('tokens'),
          Component: Tokens,
          testID: ExploreSelectors.AssetsTab
        }
      ];
    }

    const activity = {
      slug: 'activity',
      title: t('activity'),
      Component: () => <ActivityTab tokenId={tokenId} />,
      testID: ExploreSelectors.ActivityTab
    };

    // const info = {
    //   slug: 'info',
    //   title: t('info'),
    //   Component: () => <AssetInfo assetSlug={assetSlug} />,
    //   testID: ExploreSelectors.AboutTab
    // };

    return [activity];
  }, [tokenId]);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div className={classNames('-mx-4', 'shadow-top-light', fullPage && 'rounded-t-md', className)}>
      <div className={classNames('w-full max-w-sm mx-auto px-10', 'flex items-center justify-center')}>
        {tabs.map(currentTab => {
          const active = slug === currentTab.slug;

          return (
            <Link
              key={tokenId ? `asset_${currentTab.slug}` : currentTab.slug}
              to={lctn => ({ ...lctn, search: `?tab=${currentTab.slug}` })}
              replace
              className={classNames(
                'flex1 w-full',
                'text-center cursor-pointer mb-1 pb-1 pt-2',
                'text-gray-500 text-xs font-medium',
                'border-t-2',
                active ? 'border-primary-orange' : 'border-transparent',
                active ? 'text-primary-orange' : 'hover:text-primary-orange',
                'transition ease-in-out duration-300',
                'truncate'
              )}
              testID={currentTab.testID}
            >
              {currentTab.title}
            </Link>
          );
        })}
      </div>

      <div className={'mx-4 mb-4 mt-6'}>
        <SuspenseContainer whileMessage="displaying tab">{Component && <Component />}</SuspenseContainer>
      </div>
    </div>
  );
};

type SuspenseContainerProps = {
  whileMessage: string;
  fallback?: ReactNode;
};

const SuspenseContainer: FC<SuspenseContainerProps> = ({ whileMessage, fallback = <SpinnerSection />, children }) => (
  <ErrorBoundary whileMessage={whileMessage}>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
