import posthog from 'posthog-js';

export const EVENT_CLICK_SITE_MARKER = 'click_site_marker';

let isInitialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || isInitialized) {
    return;
  }

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    autocapture: true,
  });

  isInitialized = true;
}

export function track(event, properties = {}) {
  if (!isInitialized) return;
  posthog.capture(event, properties);
}

