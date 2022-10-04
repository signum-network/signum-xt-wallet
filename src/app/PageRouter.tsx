import React, { FC, useLayoutEffect, useMemo } from 'react';

import { OpenInFullPage, useAppEnv } from 'app/env';
import AddAsset from 'app/pages/AddAsset';
import CreateAccount from 'app/pages/CreateAccount';
import CreateWallet from 'app/pages/CreateWallet';
import Explore from 'app/pages/Explore';
import ImportAccount from 'app/pages/ImportAccount';
import ImportWallet from 'app/pages/ImportWallet';
import Receive from 'app/pages/Receive';
import Send from 'app/pages/Send';
import Settings from 'app/pages/Settings';
import Unlock from 'app/pages/Unlock';
import Welcome from 'app/pages/Welcome';
import { usePageRouterAnalytics } from 'lib/analytics';
import { SIGNA_TOKEN_ID, useTempleClient } from 'lib/temple/front';
import * as Woozie from 'lib/woozie';

import AttentionPage from './pages/Onboarding/pages/AttentionPage';

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    '/import-wallet',
    (_, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet />;
      }
    }
  ],
  [
    '*',
    (_p, ctx) => {
      switch (true) {
        case ctx.locked:
          return <Unlock />;

        case !ctx.ready && !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    }
  ],
  ['/', (_p, ctx) => (ctx.ready ? <Explore tokenId={SIGNA_TOKEN_ID} /> : <Welcome />)],
  ['/explore/:tokenId?', onlyReady(({ tokenId }) => <Explore tokenId={tokenId ?? SIGNA_TOKEN_ID} />)],
  ['/create-wallet', onlyNotReady(() => <CreateWallet />)],
  ['/create-account', onlyReady(() => <CreateAccount />)],
  ['/import-account/:tabSlug?', onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />)],
  ['/receive', onlyReady(() => <Receive />)],
  ['/send/:tokenId?', onlyReady(({ tokenId }) => <Send tokenId={tokenId} />)],
  // ['/dapps', onlyReady(() => <DApps />)],
  // ['/swap/:assetSlug?', onlyReady(({ assetSlug }) => <Swap assetSlug={assetSlug} />)],
  // ['/collectible/:assetSlug?', onlyReady(({ assetSlug }) => <CollectiblePage assetSlug={assetSlug!} />)],
  ['/add-token', onlyReady(onlyInFullPage(() => <AddAsset />))],
  ['/settings/:tabSlug?', onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />)],
  ['/attention', onlyReady(onlyInFullPage(() => <AttentionPage />))],
  ['*', () => <Woozie.Redirect to="/" />]
]);

const PageRouter: FC = () => {
  const { trigger, pathname, search } = Woozie.useLocation();

  // Scroll to top after new location pushed.
  useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }

    if (pathname === '/') {
      Woozie.resetHistoryPosition();
    }
  }, [trigger, pathname]);

  const appEnv = useAppEnv();
  const temple = useTempleClient();

  const ctx = useMemo<RouteContext>(
    () => ({
      popup: appEnv.popup,
      fullPage: appEnv.fullPage,
      ready: temple.ready,
      locked: temple.locked
    }),
    [appEnv.popup, appEnv.fullPage, temple.ready, temple.locked]
  );

  usePageRouterAnalytics(pathname, search, ctx.ready);

  return useMemo(() => Woozie.Router.resolve(ROUTE_MAP, pathname, ctx), [pathname, ctx]);
};

export default PageRouter;

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.Router.SKIP);
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? Woozie.Router.SKIP : factory(params, ctx));
}

function onlyInFullPage(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (!ctx.fullPage ? <OpenInFullPage /> : factory(params, ctx));
}
