/**
 * Unified Analytics Service
 *
 * This module provides a standardized API for tracking analytics events
 * across the application. It uses PostHog for implementation but keeps
 * the API abstract to allow changing providers in the future.
 */
import { AnalyticsEvent, EventPayloadMap, UserTraits } from './types';
/**
 * Initialize analytics based on configuration
 */
declare class AnalyticsService {
  private initialized;
  private client;
  constructor();
  /**
   * Initializes the analytics client based on configuration
   */
  private initClient;
  /**
   * Mocks analytics client methods for development environment
   */
  private mockAnalyticsClient;
  /**
   * Track an analytics event with type safety
   * @param event - Event name from AnalyticsEvent enum
   * @param payload - Type-checked payload object for the specific event
   */
  track<E extends AnalyticsEvent>(event: E, payload: EventPayloadMap[E]): void;
  /**
   * Track a page view event
   * @param path - Current page path
   * @param referrer - Optional referrer path
   */
  trackPageView(path: string, referrer?: string): void;
  /**
   * Identify a user
   * @param userId - User identifier
   * @param traits - Optional user properties
   */
  identify(userId: string, traits?: UserTraits): void;
  /**
   * Reset the current user (for logout)
   */
  reset(): void;
}
export declare const analytics: AnalyticsService;
export { AnalyticsEvent } from './types';
export declare const track: <E extends AnalyticsEvent>(
  event: E,
  payload: EventPayloadMap[E]
) => void;
export declare const identify: (userId: string, traits?: UserTraits) => void;
export declare const reset: () => void;
export declare const EVENTS: {
  VIEWED_PAGE: AnalyticsEvent;
  VIEWED_SAMPLE_PIN: AnalyticsEvent;
  CHANGED_THEME: AnalyticsEvent;
  SELECTED_DATE: AnalyticsEvent;
  ZOOMED_MAP: AnalyticsEvent;
  PANNED_MAP: AnalyticsEvent;
  FAILED_LOADING_DATA: AnalyticsEvent;
  ERROR_OCCURRED: AnalyticsEvent;
};
export default analytics;
