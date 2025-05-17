// Import from the new centralized analytics service
import { analytics as analyticsService } from '../services/analytics';
import eventDescriptions from './eventMapping.json';
// Type assertion for eventDescriptions
const typedEventDescriptions = eventDescriptions;
import { AnalyticsEvent } from '../types/analytics';
/**
 * Re-export the AnalyticsEvent enum
 */
export { AnalyticsEvent };
/**
 * Standardized analytics event names
 * Follow verb_object[_context] pattern in snake_case
 */
export const EVENTS = {
  VIEWED_PAGE: AnalyticsEvent.VIEWED_PAGE,
  VIEWED_SAMPLE_PIN: AnalyticsEvent.VIEWED_SAMPLE_PIN,
  CHANGED_THEME: AnalyticsEvent.CHANGED_THEME,
  SELECTED_DATE: AnalyticsEvent.SELECTED_DATE,
  ZOOMED_MAP: AnalyticsEvent.ZOOMED_MAP,
  PANNED_MAP: AnalyticsEvent.PANNED_MAP,
  FAILED_LOADING_DATA: AnalyticsEvent.FAILED_LOADING_DATA,
  ERROR_OCCURRED: AnalyticsEvent.ERROR_OCCURRED,
};
/**
 * Type-safe track function for known events with proper payload types
 */
export function trackEvent(event, payload) {
  // Add standard properties to all events
  const enhancedProps = {
    ...payload,
    eventDescription: typedEventDescriptions[event] || '',
  };
  // Log event in development for debugging
  if (import.meta.env.DEV) {
    console.info(`[Analytics] ${event} (legacy API)`, enhancedProps);
  }
  // Delegate to the new service
  analyticsService.track(event, enhancedProps);
}
/**
 * Legacy track function for backward compatibility
 * @deprecated Use trackEvent instead for type safety
 */
export const track = (eventKey, properties = {}) => {
  // Check if the event name exists in our standardized list
  if (!Object.values(AnalyticsEvent).includes(eventKey)) {
    console.warn(
      `[Analytics] Unknown event key: "${eventKey}". ` +
        'Please add it to the AnalyticsEvent enum in analytics.ts'
    );
    return;
  }
  // Add standard properties to all events
  const enhancedProps = {
    ...properties,
    eventDescription: typedEventDescriptions[eventKey] || '',
  };
  // Log event in development for debugging
  if (import.meta.env.DEV) {
    console.info(`[Analytics] ${eventKey} (legacy API)`, enhancedProps);
  }
  // Delegate to the new service
  analyticsService.track(eventKey, enhancedProps);
};
/**
 * Identify a user
 * @param userId - Unique user identifier
 * @param traits - User properties/traits
 */
export const identify = (userId, traits = {}) => {
  if (!userId) {
    console.warn('[Analytics] User ID is required for identification');
    return;
  }
  // Delegate to the new service
  analyticsService.identify(userId, traits);
};
/**
 * Reset user identity (for logout)
 */
export const reset = () => {
  // Delegate to the new service
  analyticsService.reset();
};
export default {
  track,
  trackEvent,
  identify,
  reset,
  EVENTS,
  AnalyticsEvent,
};
