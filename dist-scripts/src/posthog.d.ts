import { AnalyticsEvent, EventPayloadMap, UserTraits } from './types/analytics';
export declare const posthogClient: import('posthog-js').PostHog;
/**
 * Utility function to capture events only in production with type safety
 * @param eventName - Name of the event to capture from AnalyticsEvent enum
 * @param properties - Properties to attach to the event
 */
export declare function captureTypedEvent<E extends AnalyticsEvent>(
  eventName: E,
  properties: EventPayloadMap[E]
): void;
/**
 * Utility function to capture events only in production (legacy)
 * @deprecated Use captureTypedEvent for type safety
 * @param eventName - Name of the event to capture
 * @param properties - Properties to attach to the event
 */
export declare const captureEvent: (eventName: string, properties?: Record<string, any>) => void;
/**
 * Utility function to identify users only in production
 * @param userId - User identifier
 * @param userProperties - Properties to associate with the user
 */
export declare const identifyUser: (userId: string, userProperties?: UserTraits) => void;
/**
 * Utility function to reset after logout
 */
export declare const resetUser: () => void;
