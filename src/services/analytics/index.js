/**
 * Analytics service module for tracking user events
 * Using PostHog for event tracking
 */
import posthog from 'posthog-js';
import config from '../../config';

// Initialize PostHog with configuration from environment
if (config.analytics.enabled && config.analytics.posthogApiKey) {
  posthog.init(config.analytics.posthogApiKey, {
    api_host: config.analytics.posthogHost,
    loaded: function(posthog) {
      console.log('PostHog analytics initialized');
    },
    capture_pageview: true,
    autocapture: true,
  });
} else {
  console.log('Analytics disabled or missing API key');
}

/**
 * Track an event with PostHog
 * @param {string} eventName - Name of the event
 * @param {Object} [properties] - Properties to include with the event
 */
function track(eventName, properties = {}) {
  if (!config.analytics.enabled) {
    // Just log the event in development
    if (config.isDevelopment) {
      console.log(`[Analytics] ${eventName}`, properties);
    }
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
}

/**
 * Identify a user with PostHog
 * @param {string} userId - User identifier
 * @param {Object} [traits] - Additional user traits to track
 */
function identify(userId, traits = {}) {
  if (!config.analytics.enabled) return;

  try {
    posthog.identify(userId, traits);
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
}

/**
 * Common event names used throughout the application
 */
const AnalyticsEvents = {
  VIEWED_SAMPLE_PIN: 'viewed_sample_pin',
  SELECTED_DATE: 'selected_date',
  ZOOMED_MAP: 'zoomed_map',
  PANNED_MAP: 'panned_map',
  CHANGED_THEME: 'changed_theme',
  ERROR_OCCURRED: 'error_occurred',
  FAILED_LOADING_DATA: 'failed_loading_data'
};

// Export the analytics service
export const analytics = {
  track,
  identify,
};

export { AnalyticsEvents };