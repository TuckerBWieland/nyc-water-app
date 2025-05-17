/**
 * Composable for Leaflet marker management with water quality styling
 */
import { Ref } from 'vue';
import { GeoJSONFeature, GeoJSONCollection } from '../types/geojson';
/** Water quality rating enumeration */
export declare enum WaterQuality {
  GOOD = 'good',
  MODERATE = 'moderate',
  POOR = 'poor',
}
/** Marker creation options */
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
/**
 * Convert MPN value to water quality rating
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns Water quality rating
 */
export declare function getMpnRating(
  mpn: string | number,
  lowThreshold?: number,
  mediumThreshold?: number
): WaterQuality;
/**
 * Get color for MPN value based on water quality rating
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns Hex color code for the water quality
 */
export declare function getColorForMPN(
  mpn: string | number,
  lowThreshold?: number,
  mediumThreshold?: number
): string;
/**
 * Get quality message based on MPN value
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns Descriptive message for the water quality
 */
export declare function getQualityMessage(
  mpn: string | number,
  lowThreshold?: number,
  mediumThreshold?: number
): string;
/**
 * Get CSS class for MPN value
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns CSS class for the water quality
 */
export declare function getQualityClass(
  mpn: string | number,
  lowThreshold?: number,
  mediumThreshold?: number
): string;
/**
 * Sanitize string for use in HTML
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export declare function sanitizeHtml(str: string): string;
/**
 * Hook for managing water quality markers on a map
 * @param map - Leaflet map instance
 * @param options - Marker customization options
 * @returns Object with marker management functions
 */
export declare function useMarkers(
  map: Ref<L.Map | null>,
  options?: MarkerOptions
): {
  markers: Ref<any[], any[]>;
  markerCount: Ref<number, number>;
  processedFeatures: Ref<number, number>;
  addMarker: (feature: GeoJSONFeature) => L.Marker | null;
  clearMarkers: () => void;
  updateFromGeoJSON: (collection: GeoJSONCollection) => void;
  getFeatureGroup: () => L.FeatureGroup | null;
  updatePopupStyles: (isDark: boolean) => void;
  createWaterBottleIcon: (mpn: string | number) => L.DivIcon;
  createPopupContent: (feature: GeoJSONFeature) => string;
};
