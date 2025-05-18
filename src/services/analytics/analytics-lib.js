// Import from the new centralized analytics service
import { analytics as analyticsService } from './index.js';
import eventDescriptions from './lib/eventMapping.json';

/**
 * AnalyticsEvent - Standardized event names for analytics tracking
 * @enum {string}
 */
export const AnalyticsEvent = {
  VIEWED_PAGE: 'viewed_page',
  VIEWED_SAMPLE_PIN: 'viewed_sample_pin',
  CHANGED_THEME: 'changed_theme',
  SELECTED_DATE: 'selected_date',
  ZOOMED_MAP: 'zoomed_map',
  PANNED_MAP: 'panned_map',
  FAILED_LOADING_DATA: 'failed_loading_data',
  ERROR_OCCURRED: 'error_occurred',
};

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
 * Tracks an event with type-checking
 * @param {string} event - Event name from AnalyticsEvent
 * @param {Object} payload - Payload object for the specific event
 */
export function trackEvent(event, payload) {
  // Add standard properties to all events
  const enhancedProps = {
    ...payload,
    eventDescription: eventDescriptions[event] || '',
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
 * @param {string} eventKey - Event name
 * @param {Object} properties - Event properties
 */
export const track = (eventKey, properties = {}) => {
  // Check if the event name exists in our standardized list
  const validEvents = Object.values(AnalyticsEvent);
  if (!validEvents.includes(eventKey)) {
    console.warn(
      `[Analytics] Unknown event key: "${eventKey}". ` +
        'Please add it to the AnalyticsEvent enum in analytics.js'
    );
    return;
  }

  // Add standard properties to all events
  const enhancedProps = {
    ...properties,
    eventDescription: eventDescriptions[eventKey] || '',
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
 * @param {string} userId - Unique user identifier
 * @param {Object} traits - User properties/traits
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
