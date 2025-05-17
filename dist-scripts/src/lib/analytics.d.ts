import { AnalyticsEvent, EventPayloadMap, UserTraits as UserTraitsType } from '../types/analytics';
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
export declare const EVENTS: EventsRecord;
export type UserTraits = UserTraitsType;
/**
 * Type-safe track function for known events with proper payload types
 */
export declare function trackEvent<E extends AnalyticsEvent>(event: E, payload: EventPayloadMap[E]): void;
/**
 * Legacy track function for backward compatibility
 * @deprecated Use trackEvent instead for type safety
 */
export declare const track: (eventKey: string, properties?: Record<string, any>) => void;
/**
 * Identify a user
 * @param userId - Unique user identifier
 * @param traits - User properties/traits
 */
export declare const identify: (userId: string, traits?: UserTraitsType) => void;
/**
 * Reset user identity (for logout)
 */
export declare const reset: () => void;
declare const _default: {
    track: (eventKey: string, properties?: Record<string, any>) => void;
    trackEvent: typeof trackEvent;
    identify: (userId: string, traits?: UserTraitsType) => void;
    reset: () => void;
    EVENTS: EventsRecord;
    AnalyticsEvent: typeof AnalyticsEvent;
};
export default _default;
