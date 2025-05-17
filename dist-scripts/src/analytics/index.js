/**
 * Unified Analytics Service
 *
 * This module provides a standardized API for tracking analytics events
 * across the application. It uses PostHog for implementation but keeps
 * the API abstract to allow changing providers in the future.
 */
import posthog from 'posthog-js';
import config from '../config';
import { AnalyticsEvent } from './types';
import eventDescriptions from '../lib/eventMapping.json';
// Create typed event descriptions
const typedEventDescriptions = eventDescriptions;
/**
 * Initialize analytics based on configuration
 */
class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.client = this.initClient();
  }
  /**
   * Initializes the analytics client based on configuration
   */
  initClient() {
    // Already initialized, return existing client
    if (this.initialized) {
      return this.client;
    }
    // Extract configuration
    const { enabled, posthogApiKey, posthogHost } = config.analytics;
    if (!posthogApiKey && enabled) {
      console.warn(
        'Analytics API key not found in environment variables. Analytics will be disabled.'
      );
    }
    if (enabled && posthogApiKey) {
      // Initialize PostHog with API key from environment variables
      posthog.init(posthogApiKey, {
        api_host: posthogHost,
        // Disable capturing by default
        capture_pageview: false,
        // Disable auto-capturing of events like clicks
        autocapture: false,
        // Debug mode in development
        debug: config.isDevelopment,
      });
      if (config.isDevelopment) {
        console.info('[Analytics] PostHog initialized with API key:', posthogApiKey);
        console.info('[Analytics] API host:', posthogHost);
        console.info('[Analytics] Debug mode enabled');
      }
    } else {
      // In development or when disabled, replace methods with mocks
      this.mockAnalyticsClient(posthog);
      if (config.isDevelopment) {
        console.info('[Analytics] PostHog initialized in mock mode (events will not be sent)');
        console.info(
          '[Analytics] To enable real analytics tracking in development, set VITE_ENABLE_ANALYTICS=true'
        );
      }
    }
    this.initialized = true;
    return posthog;
  }
  /**
   * Mocks analytics client methods for development environment
   */
  mockAnalyticsClient(client) {
    Object.keys(client).forEach(key => {
      if (typeof client[key] === 'function') {
        // Mock the function to log to console instead
        client[key] = (...args) => {
          console.log(`[Analytics Mock] ${key}:`, ...args);
          return client;
        };
      }
    });
  }
  /**
   * Track an analytics event with type safety
   * @param event - Event name from AnalyticsEvent enum
   * @param payload - Type-checked payload object for the specific event
   */
  track(event, payload) {
    // Add standard properties to all events
    const enhancedProps = {
      ...payload,
      eventDescription: typedEventDescriptions[event] || '',
      timestamp: new Date().toISOString(),
    };
    // Development logging (always log in development for debugging)
    if (config.isDevelopment) {
      console.info(`[Analytics] ${event}`, enhancedProps);
    }
    // Send to provider
    this.client.capture(event, enhancedProps);
    // Log success in development mode
    if (config.isDevelopment && config.analytics.enabled) {
      console.info(`[Analytics] Event sent to PostHog: ${event}`);
    }
  }
  /**
   * Track a page view event
   * @param path - Current page path
   * @param referrer - Optional referrer path
   */
  trackPageView(path, referrer) {
    this.track(AnalyticsEvent.VIEWED_PAGE, {
      page: path,
      referrer,
    });
  }
  /**
   * Identify a user
   * @param userId - User identifier
   * @param traits - Optional user properties
   */
  identify(userId, traits = {}) {
    if (!userId) {
      console.warn('User ID is required for identification');
      return;
    }
    this.client.identify(userId, traits);
    if (config.isDevelopment) {
      console.info(`[Analytics] Identified user: ${userId}`, traits);
    }
  }
  /**
   * Reset the current user (for logout)
   */
  reset() {
    this.client.reset();
    if (config.isDevelopment) {
      console.info('[Analytics] User reset');
    }
  }
}
// Export singleton instance
export const analytics = new AnalyticsService();
// Export event enum for use throughout the app
export { AnalyticsEvent } from './types';
// Backward compatibility exports for legacy code
export const track = (event, payload) => {
  analytics.track(event, payload);
};
export const identify = (userId, traits = {}) => {
  analytics.identify(userId, traits);
};
export const reset = () => {
  analytics.reset();
};
// Legacy event names object (for backward compatibility)
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
export default analytics;
