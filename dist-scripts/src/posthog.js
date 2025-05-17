import posthog from 'posthog-js';
import { analytics as analyticsConfig } from './config';
/**
 * Only initialize PostHog in production environment
 * @returns The initialized PostHog client
 */
const initPostHog = () => {
  // Check if analytics are enabled
  const isEnabled = analyticsConfig.enabled;
  const apiKey = analyticsConfig.posthogApiKey;
  const apiHost = analyticsConfig.posthogHost;
  if (!apiKey) {
    console.warn('PostHog API key not found in environment variables. Analytics will be disabled.');
  }
  if (isEnabled && apiKey) {
    // Initialize PostHog with API key from environment variables
    posthog.init(apiKey, {
      api_host: apiHost,
      // Disable capturing by default
      capture_pageview: false,
      // Disable auto-capturing of events like clicks
      autocapture: false,
    });
  } else {
    // In development or when disabled, replace posthog with a mock version
    // that logs to console instead of sending events
    Object.keys(posthog).forEach(key => {
      if (typeof posthog[key] === 'function') {
        // This type assertion is necessary because we're dynamically accessing properties
        posthog[key] = (...args) => {
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
 * Utility function to capture events only in production with type safety
 * @param eventName - Name of the event to capture from AnalyticsEvent enum
 * @param properties - Properties to attach to the event
 */
export function captureTypedEvent(eventName, properties) {
  posthogClient.capture(eventName, properties);
}
/**
 * Utility function to capture events only in production (legacy)
 * @deprecated Use captureTypedEvent for type safety
 * @param eventName - Name of the event to capture
 * @param properties - Properties to attach to the event
 */
export const captureEvent = (eventName, properties = {}) => {
  posthogClient.capture(eventName, properties);
};
/**
 * Utility function to identify users only in production
 * @param userId - User identifier
 * @param userProperties - Properties to associate with the user
 */
export const identifyUser = (userId, userProperties = {}) => {
  posthogClient.identify(userId, userProperties);
};
/**
 * Utility function to reset after logout
 */
export const resetUser = () => {
  posthogClient.reset();
};
