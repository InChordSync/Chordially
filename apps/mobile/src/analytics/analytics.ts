export enum AnalyticsEvent {
  SCREEN_VIEW = 'SCREEN_VIEW',
  TAB_CHANGE = 'TAB_CHANGE',
  BUTTON_PRESS = 'BUTTON_PRESS',
  SESSION_START = 'SESSION_START',
  ERROR = 'ERROR',
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log('[Analytics]', event, properties ?? {});
  } else {
    // TODO: forward to real analytics SDK (e.g. Segment, Amplitude)
    // analyticsSDK.track(event, properties);
  }
}

export function trackScreen(screenName: string): void {
  track(AnalyticsEvent.SCREEN_VIEW, { screen: screenName });
}
