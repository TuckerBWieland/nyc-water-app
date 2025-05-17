/**
 * Type definitions for map-related functionality.
 * These types enhance Leaflet with app-specific extensions.
 */

/**
 * Water quality rating enumeration
 */
export enum WaterQuality {
  GOOD = 'good',
  MODERATE = 'moderate',
  POOR = 'poor',
}

/**
 * Map initialization options
 */
export interface MapOptions {
  /** HTML element ID to mount the map */
  elementId: string;
  /** Initial latitude */
  lat?: number;
  /** Initial longitude */
  lng?: number;
  /** Initial zoom level */
  zoom?: number;
  /** Whether map is in dark mode */
  isDarkMode?: boolean;
  /** Whether to track analytics for interactions */
  trackAnalytics?: boolean;
  /** Whether to add zoom controls */
  zoomControls?: boolean;
}

/**
 * Marker creation options
 */
export interface MarkerOptions {
  /** Whether to track marker interactions in analytics */
  trackAnalytics?: boolean;
  /** Whether markers use dark mode styling */
  isDarkMode?: boolean;
  /** Customized threshold for low MPN */
  lowThreshold?: number;
  /** Customized threshold for medium MPN */
  mediumThreshold?: number;
}
