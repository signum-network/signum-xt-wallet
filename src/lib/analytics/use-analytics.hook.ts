// import { useCallback } from 'react';

export const useAnalytics = () => {
  // const { analyticsState } = useAnalyticsState();
  // const rpc = useAnalyticsNetwork();
  //
  // const trackEvent = useCallback(
  //   (event: string, category: AnalyticsEventCategory = AnalyticsEventCategory.General, properties?: object) =>
  //     analyticsState.enabled && sendTrackEvent(analyticsState.userId, rpc, event, category, properties),
  //   [analyticsState.enabled, analyticsState.userId, rpc]
  // );
  //
  // const pageEvent = useCallback(
  //   (path: string, search: string, tokenAddress?: string, tokenId?: string) =>
  //     analyticsState.enabled && sendPageEvent(analyticsState.userId, rpc, path, search, tokenAddress, tokenId),
  //   [analyticsState.enabled, analyticsState.userId, rpc]
  // );

  return {
    trackEvent: (..._: any[]) => {},
    pageEvent: (..._: any[]) => {}
  };
};
