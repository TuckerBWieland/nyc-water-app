/**
 * Configuration module for environment-specific settings
 *
 * This module centralizes and validates all configuration from environment variables.
 * Each variable is validated and has a default value if not defined in the environment.
 */

/**
 * Gets an environment variable with type safety
 * @param {string} key - Environment variable name
 * @param {string|number|boolean} defaultValue - Default value if not found
 * @returns {string|number|boolean} The environment variable value or default
 */
function getEnvVar(key, defaultValue) {
  const value = import.meta.env[key];

  if (value === undefined) {
    console.warn(`Environment variable ${key} not found, using default: ${defaultValue}`);
    return defaultValue;
  }

  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    return Number(value);
  } else if (typeof defaultValue === 'boolean') {
    return value === 'true';
  }

  return value;
}

/**
 * PostHog Analytics Configuration
 */
export const analytics = {
  posthogApiKey: getEnvVar('VITE_POSTHOG_API_KEY', ''),
  posthogHost: getEnvVar('VITE_POSTHOG_HOST', 'https://app.posthog.com'),
  enabled: getEnvVar('VITE_ENABLE_ANALYTICS', import.meta.env.PROD === true), // Convert PROD to boolean and use as default
};

/**
 * Map Configuration
 */
export const map = {
  defaultLatitude: getEnvVar('VITE_MAP_DEFAULT_LAT', 40.7128),
  defaultLongitude: getEnvVar('VITE_MAP_DEFAULT_LNG', -74.006),
  defaultZoom: getEnvVar('VITE_MAP_DEFAULT_ZOOM', 12),
  tileUrls: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  },
};

/**
 * NOAA API Configuration
 */
export const noaa = {
  apiBaseUrl: getEnvVar('VITE_NOAA_API_BASE_URL', 'https://api.tidesandcurrents.noaa.gov'),
  stationsEndpoint: '/mdapi/prod/webapi/stations.json',
  waterLevelEndpoint: '/api/prod/datagetter',
};

/**
 * Water Quality Thresholds
 */
export const waterQuality = {
  mpnThresholds: {
    low: 35, // Below this is good quality
    medium: 104, // Below this is moderate quality
    // Above medium threshold is poor quality
  },
  colors: {
    good: '#4CAF50', // Green
    moderate: '#FFC107', // Yellow
    poor: '#F44336', // Red
  },
};

/**
 * Application Paths
 */
export const paths = {
  data: getEnvVar('VITE_DATA_PATH', 'data'),
};

/**
 * Combined configuration
 */
export default {
  analytics,
  map,
  noaa,
  waterQuality,
  paths,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};