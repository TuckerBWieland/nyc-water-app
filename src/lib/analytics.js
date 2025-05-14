import { posthogClient } from '../posthog';
import eventDescriptions from './eventMapping.json';

/**
 * Standardized analytics event names
 * Follow verb_object[_context] pattern in snake_case
 */
export const EVENTS = {
  VIEWED_PAGE: 'viewed_page',
  VIEWED_SAMPLE_PIN: 'viewed_sample_pin',
  CHANGED_THEME: 'changed_theme',
  SELECTED_DATE: 'selected_date',
  ZOOMED_MAP: 'zoomed_map',
  PANNED_MAP: 'panned_map',
  FAILED_LOADING_DATA: 'failed_loading_data'
};

/**
 * Track an analytics event
 * @param {string} eventKey - Event key from EVENTS object
 * @param {Object} [properties={}] - Event properties 
 * @returns {void}
 */
export const track = (eventKey, properties = {}) => {
  // Check if the event name exists in our standardized list
  const eventName = Object.values(EVENTS).includes(eventKey) 
    ? eventKey 
    : null;
  
  if (!eventName) {
    console.warn(
      `[Analytics] Unknown event key: "${eventKey}". ` +
      'Please add it to the EVENTS object in analytics.js'
    );
    return;
  }
  
  // Add standard properties to all events
  const enhancedProps = {
    ...properties,
    timestamp: new Date().toISOString(),
    eventDescription: eventDescriptions[eventName] || ''
  };
  
  // Log event in development for debugging
  if (import.meta.env.DEV) {
    console.info(`[Analytics] ${eventName}`, enhancedProps);
  }
  
  // Send to PostHog
  posthogClient.capture(eventName, enhancedProps);
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
  
  posthogClient.identify(userId, traits);
};

/**
 * Reset user identity (for logout)
 */
export const reset = () => {
  posthogClient.reset();
};

export default {
  track,
  identify,
  reset,
  EVENTS
};