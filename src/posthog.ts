import posthog from 'posthog-js';

/**
 * PostHog client properties
 */
export interface PosthogProperties {
  [key: string]: any;
}

/**
 * Only initialize PostHog in production environment
 * @returns The initialized PostHog client
 */
const initPostHog = (): typeof posthog => {
  // Check if we're in production mode
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    // Initialize PostHog with your project API key
    posthog.init('phc_w0axXDyN3zCal0qUUsV83NnyCoKsI9AKHXR59aat3tP', {
      api_host: 'https://app.posthog.com',
      // Disable capturing by default
      capture_pageview: false,
      // Disable auto-capturing of events like clicks
      autocapture: false,
    });
  } else {
    // In development, replace posthog with a mock version
    // that logs to console instead of sending events
    Object.keys(posthog).forEach(key => {
      if (typeof posthog[key as keyof typeof posthog] === 'function') {
        // This type assertion is necessary because we're dynamically accessing properties
        (posthog as any)[key] = (...args: any[]) => {
          console.log(`[PostHog DEV] ${key}:`, ...args);
          return posthog;
        };
      }
    });
  }

  return posthog;
};

export const posthogClient = initPostHog();

/**
 * Utility function to capture events only in production
 * @param eventName - Name of the event to capture
 * @param properties - Properties to attach to the event
 */
export const captureEvent = (eventName: string, properties: PosthogProperties = {}): void => {
  posthogClient.capture(eventName, properties);
};

/**
 * Utility function to identify users only in production
 * @param userId - User identifier
 * @param userProperties - Properties to associate with the user
 */
export const identifyUser = (userId: string, userProperties: PosthogProperties = {}): void => {
  posthogClient.identify(userId, userProperties);
};

/**
 * Utility function to reset after logout
 */
export const resetUser = (): void => {
  posthogClient.reset();
};