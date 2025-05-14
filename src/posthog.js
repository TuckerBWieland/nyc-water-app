import posthog from 'posthog-js'

// Only initialize PostHog in production environment
const initPostHog = () => {
  // Check if we're in production mode
  const isProduction = import.meta.env.PROD

  if (isProduction) {
    // Initialize PostHog with your project API key
    posthog.init('YOUR_POSTHOG_API_KEY', {
      api_host: 'https://app.posthog.com',
      // Disable capturing by default
      capture_pageview: false,
      // Disable auto-capturing of events like clicks
      autocapture: false
    })
  } else {
    // In development, replace posthog with a mock version
    // that logs to console instead of sending events
    Object.keys(posthog).forEach(key => {
      if (typeof posthog[key] === 'function') {
        posthog[key] = (...args) => {
          console.log(`[PostHog DEV] ${key}:`, ...args)
          return posthog
        }
      }
    })
  }

  return posthog
}

export const posthogClient = initPostHog()

// Utility function to capture events only in production
export const captureEvent = (eventName, properties = {}) => {
  posthogClient.capture(eventName, properties)
}

// Utility function to identify users only in production
export const identifyUser = (userId, userProperties = {}) => {
  posthogClient.identify(userId, userProperties)
}

// Utility function to reset after logout
export const resetUser = () => {
  posthogClient.reset()
}