/**
 * Global analytics module declaration
 */

// Import required types
import { AnalyticsEvent, EventPayloadMap } from '../analytics/types';

// Declare global event descriptions module
declare module 'eventDescriptions' {
  const eventDescriptions: Record<AnalyticsEvent, string>;
  export default eventDescriptions;
}

// Re-export types for convenience
export { AnalyticsEvent, EventPayloadMap } from '../analytics/types';