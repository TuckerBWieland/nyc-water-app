// Dynamically imported PostHog instance
import type { PostHog } from 'posthog-js';
let posthog: PostHog | undefined;

export const EVENT_CLICK_SITE_MARKER = 'click_site_marker';
export const EVENT_CLICK_DATA_INFO_BUTTON = 'click_data_info_button';
export const EVENT_CLICK_DONATE_BUTTON = 'click_donate_button';
export const EVENT_CLICK_OUTBOUND_LINK = 'click_outbound_link';
export const EVENT_OPEN_POPUP = 'open_popup';

let isInitialized = false;

export async function initAnalytics() {
  try {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    
    if (isInitialized) {
      console.warn('PostHog already initialized');
      return;
    }
    
    if (!key) {
      console.warn('PostHog key not found in environment variables. Analytics will be disabled.');
      return;
    }

    console.log('Initializing PostHog analytics...');
    const mod = await import('posthog-js');
    posthog = mod.default || mod;

    const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
    
    posthog.init(key, {
      api_host: host,
      autocapture: true,
      debug: import.meta.env.MODE === 'development',
    });

    isInitialized = true;
    console.log('PostHog analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    // Don't throw - let the app work without analytics
  }
}

export function track(event: string, properties: Record<string, any> = {}) {
  try {
    if (!isInitialized || !posthog) {
      console.debug('Analytics not initialized, skipping event:', event);
      return;
    }
    
    console.debug('Tracking event:', event, properties);
    posthog.capture(event, properties);
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw - let the app continue working
  }
}
