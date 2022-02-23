import { v4 as uuid } from 'uuid';

import { useLocalStorage } from 'lib/temple/front/local-storage';

import { AnalyticsEventCategory } from './analytics-event.enum';

interface AnalyticsStateInterface {
  enabled?: boolean;
  userId: string;
}

export const sendTrackEvent = async (
  userId: string,
  rpc: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  // TODO: if we use this then reimplement
  // const chainId = rpc && (await loadChainId(rpc));
  // client.track({
  //   userId,
  //   event: `${category} ${event}`,
  //   timestamp: new Date(),
  //   properties: {
  //     ...properties,
  //     event,
  //     category,
  //     chainId
  //   }
  // });
};

export const sendPageEvent = async (
  userId: string,
  rpc: string | undefined,
  path: string,
  search: string,
  tokenAddress?: string,
  tokenId?: string
) => {
  // TODO: if we use this then reimplement
  // const url = `${path}${search}`;
  // const chainId = rpc && (await loadChainId(rpc));
  // client.page({
  //   userId,
  //   name: url,
  //   timestamp: new Date(),
  //   category: AnalyticsEventCategory.PageOpened,
  //   properties: {
  //     url,
  //     path: search,
  //     referrer: path,
  //     category: AnalyticsEventCategory.PageOpened,
  //     chainId,
  //     ...(tokenAddress !== undefined && { tokenAddress }),
  //     ...(tokenId !== undefined && { tokenId })
  //   }
  // });
};

export const useAnalyticsState = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: uuid()
  });

  return {
    analyticsState,
    setAnalyticsState
  };
};
