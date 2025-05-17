import { posthogClient } from '../posthog';
import eventDescriptions from './eventMapping.json';

/**
 * Type definition for analytics events
 */
export type EventName = 
  | 'viewed_page'
  | 'viewed_sample_pin'
  | 'changed_theme'
  | 'selected_date'
  | 'zoomed_map'
  | 'panned_map'
  | 'failed_loading_data';

/**
 * Type for the EVENTS constant object
 */
export type EventsRecord = Record<string, EventName>;

/**
 * Standardized analytics event names
 * Follow verb_object[_context] pattern in snake_case
 */
export const EVENTS: EventsRecord = {
  VIEWED_PAGE: 'viewed_page',
  VIEWED_SAMPLE_PIN: 'viewed_sample_pin',
  CHANGED_THEME: 'changed_theme',
  SELECTED_DATE: 'selected_date',
  ZOOMED_MAP: 'zoomed_map',
  PANNED_MAP: 'panned_map',
  FAILED_LOADING_DATA: 'failed_loading_data',
};

/**
 * Properties that can be passed to tracking events
 */
export interface TrackingProperties {
  [key: string]: any;
  page?: string;
  referrer?: string;
  theme?: string;
  date?: string;
  zoomLevel?: number;
  sampleId?: string;
  error?: string;
}

/**
 * Track an analytics event
 * @param eventKey - Event key from EVENTS object
 * @param properties - Event properties
 * @returns void
 */
export const track = (eventKey: string, properties: TrackingProperties = {}): void => {
  // Check if the event name exists in our standardized list
  const eventName = Object.values(EVENTS).includes(eventKey as EventName) ? eventKey : null;
  
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
    eventDescription: eventDescriptions[eventName as keyof typeof eventDescriptions] || '',
  };
  
  // Log event in development for debugging
  if (import.meta.env.DEV) {
    console.info(`[Analytics] ${eventName}`, enhancedProps);
  }
  
  // Send to PostHog
  posthogClient.capture(eventName, enhancedProps);
};

/**
 * User traits interface
 */
export interface UserTraits {
  [key: string]: any;
  name?: string;
  email?: string;
}

/**
 * Identify a user
 * @param userId - Unique user identifier
 * @param traits - User properties/traits
 */
export const identify = (userId: string, traits: UserTraits = {}): void => {
  if (!userId) {
    console.warn('[Analytics] User ID is required for identification');
    return;
  }
  posthogClient.identify(userId, traits);
};

/**
 * Reset user identity (for logout)
 */
export const reset = (): void => {
  posthogClient.reset();
};

export default {
  track,
  identify,
  reset,
  EVENTS,
};