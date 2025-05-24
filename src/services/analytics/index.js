// Dynamically imported PostHog instance
let posthog;

export const EVENT_CLICK_SITE_MARKER = 'click_site_marker';
export const EVENT_CLICK_DATA_INFO_BUTTON = 'click_data_info_button';
export const EVENT_CLICK_DONATE_BUTTON = 'click_donate_button';
export const EVENT_CLICK_OUTBOUND_LINK = 'click_outbound_link';
export const EVENT_OPEN_POPUP = 'open_popup';

let isInitialized = false;

export async function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || isInitialized) {
    return;
  }

  const mod = await import('posthog-js');
  posthog = mod.default || mod;

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
