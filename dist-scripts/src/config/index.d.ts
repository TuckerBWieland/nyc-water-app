/**
 * Configuration module for environment-specific settings
 *
 * This module centralizes and validates all configuration from environment variables.
 * Each variable is validated and has a default value if not defined in the environment.
 */
/**
 * PostHog Analytics Configuration
 */
export declare const analytics: {
    posthogApiKey: "";
    posthogHost: "https://app.posthog.com";
    enabled: boolean;
};
/**
 * Map Configuration
 */
export declare const map: {
    defaultLatitude: 40.7128;
    defaultLongitude: -74.006;
    defaultZoom: 12;
    tileUrls: {
        light: string;
        dark: string;
    };
};
/**
 * NOAA API Configuration
 */
export declare const noaa: {
    apiBaseUrl: "https://api.tidesandcurrents.noaa.gov";
    stationsEndpoint: string;
    waterLevelEndpoint: string;
};
/**
 * Water Quality Thresholds
 */
export declare const waterQuality: {
    mpnThresholds: {
        low: number;
        medium: number;
    };
    colors: {
        good: string;
        moderate: string;
        poor: string;
    };
};
/**
 * Application Paths
 */
export declare const paths: {
    data: "data";
};
/**
 * Combined configuration
 */
declare const _default: {
    analytics: {
        posthogApiKey: "";
        posthogHost: "https://app.posthog.com";
        enabled: boolean;
    };
    map: {
        defaultLatitude: 40.7128;
        defaultLongitude: -74.006;
        defaultZoom: 12;
        tileUrls: {
            light: string;
            dark: string;
        };
    };
    noaa: {
        apiBaseUrl: "https://api.tidesandcurrents.noaa.gov";
        stationsEndpoint: string;
        waterLevelEndpoint: string;
    };
    waterQuality: {
        mpnThresholds: {
            low: number;
            medium: number;
        };
        colors: {
            good: string;
            moderate: string;
            poor: string;
        };
    };
    paths: {
        data: "data";
    };
    isDevelopment: boolean;
    isProduction: boolean;
};
export default _default;
