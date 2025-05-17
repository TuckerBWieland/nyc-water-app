// Import from the new centralized analytics service
import { analytics as analyticsService } from '../services/analytics';
import eventDescriptions from './eventMapping.json';
import { 
  AnalyticsEvent, 
  EventPayload, 
  EventPayloadMap,
  UserTraits as UserTraitsType
} from '../types/analytics';

/**
 * Re-export the AnalyticsEvent enum
 */
export { AnalyticsEvent };

/**
 * Type for the EVENTS constant object (for backward compatibility)
 */
export type EventsRecord = Record<string, string>;

/**
 * Standardized analytics event names
 * Follow verb_object[_context] pattern in snake_case
 */
export const EVENTS: EventsRecord = {
  VIEWED_PAGE: AnalyticsEvent.VIEWED_PAGE,
  VIEWED_SAMPLE_PIN: AnalyticsEvent.VIEWED_SAMPLE_PIN,
  CHANGED_THEME: AnalyticsEvent.CHANGED_THEME,
  SELECTED_DATE: AnalyticsEvent.SELECTED_DATE,
  ZOOMED_MAP: AnalyticsEvent.ZOOMED_MAP,
  PANNED_MAP: AnalyticsEvent.PANNED_MAP,
  FAILED_LOADING_DATA: AnalyticsEvent.FAILED_LOADING_DATA,
  ERROR_OCCURRED: AnalyticsEvent.ERROR_OCCURRED,
};

// Re-export UserTraits for backward compatibility
export type UserTraits = UserTraitsType;

/**
 * Type-safe track function for known events with proper payload types
 */
export function trackEvent<E extends AnalyticsEvent>(
  event: E,
  payload: EventPayloadMap[E]
): void {
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
  analyticsService.track(event, enhancedProps as any);
}

/**
 * Legacy track function for backward compatibility
 * @deprecated Use trackEvent instead for type safety
 */
export const track = (eventKey: string, properties: Record<string, any> = {}): void => {
  // Check if the event name exists in our standardized list
  if (!Object.values(AnalyticsEvent).includes(eventKey as AnalyticsEvent)) {
    console.warn(
      `[Analytics] Unknown event key: "${eventKey}". ` +
        'Please add it to the AnalyticsEvent enum in analytics.ts'
    );
    return;
  }
  
  // Add standard properties to all events
  const enhancedProps = {
    ...properties,
    eventDescription: eventDescriptions[eventKey as keyof typeof eventDescriptions] || '',
  };
  
  // Log event in development for debugging
  if (import.meta.env.DEV) {
    console.info(`[Analytics] ${eventKey} (legacy API)`, enhancedProps);
  }
  
  // Delegate to the new service
  analyticsService.track(eventKey as AnalyticsEvent, enhancedProps);
};

/**
 * Identify a user
 * @param userId - Unique user identifier
 * @param traits - User properties/traits
 */
export const identify = (userId: string, traits: UserTraitsType = {}): void => {
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
export const reset = (): void => {
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