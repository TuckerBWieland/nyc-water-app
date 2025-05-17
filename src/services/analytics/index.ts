/**
 * Unified Analytics Service
 * 
 * This module provides a standardized API for tracking analytics events
 * across the application. It uses PostHog for implementation but keeps
 * the API abstract to allow changing providers in the future.
 */

import posthog from 'posthog-js';
import config from '../../config';
import { AnalyticsEvent, EventPayloadMap, UserTraits } from '../../types/analytics';

/**
 * Initialize analytics based on configuration
 */
class AnalyticsService {
  private initialized: boolean = false;
  private client: typeof posthog;

  constructor() {
    this.client = this.initClient();
  }

  /**
   * Initializes the analytics client based on configuration
   */
  private initClient(): typeof posthog {
    // Already initialized, return existing client
    if (this.initialized) {
      return this.client;
    }

    // Extract configuration
    const { enabled, posthogApiKey, posthogHost } = config.analytics;
    
    if (!posthogApiKey && enabled) {
      console.warn('Analytics API key not found in environment variables. Analytics will be disabled.');
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
        console.info('[Analytics] To enable real analytics tracking in development, set VITE_ENABLE_ANALYTICS=true');
      }
    }

    this.initialized = true;
    return posthog;
  }

  /**
   * Mocks analytics client methods for development environment
   */
  private mockAnalyticsClient(client: typeof posthog): void {
    Object.keys(client).forEach(key => {
      if (typeof client[key as keyof typeof client] === 'function') {
        // Mock the function to log to console instead
        (client as any)[key] = (...args: any[]) => {
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
  public track<E extends AnalyticsEvent>(event: E, payload: EventPayloadMap[E]): void {
    // Add standard properties to all events
    const enhancedProps = {
      ...payload,
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
  public trackPageView(path: string, referrer?: string): void {
    this.track(AnalyticsEvent.VIEWED_PAGE, {
      page: path,
      referrer
    });
  }

  /**
   * Identify a user
   * @param userId - User identifier
   * @param traits - Optional user properties
   */
  public identify(userId: string, traits: UserTraits = {}): void {
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
  public reset(): void {
    this.client.reset();
    
    if (config.isDevelopment) {
      console.info('[Analytics] User reset');
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export event enum for use throughout the app
export { AnalyticsEvent } from '../../types/analytics';

// Backward compatibility exports
export const track = <E extends AnalyticsEvent>(event: E, payload: EventPayloadMap[E]): void => {
  analytics.track(event, payload);
};

export const identify = (userId: string, traits: UserTraits = {}): void => {
  analytics.identify(userId, traits);
};

export const reset = (): void => {
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