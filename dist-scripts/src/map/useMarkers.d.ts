/**
 * Composable for Leaflet marker management with water quality styling
 */
import { Ref } from 'vue';
import { GeoJSONFeature, GeoJSONCollection } from '../data/types';
import { WaterQuality, MarkerOptions } from './types';
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
 * Return value interface for the composable
 */
export interface MarkerManager {
  /** All current markers */
  markers: Ref<L.Marker[]>;
  /** Count of markers */
  markerCount: Ref<number>;
  /** Count of processed features */
  processedFeatures: Ref<number>;
  /** Function to add a marker for a feature */
  addMarker: (feature: GeoJSONFeature) => L.Marker | null;
  /** Function to clear all markers */
  clearMarkers: () => void;
  /** Function to update markers from GeoJSON data */
  updateFromGeoJSON: (collection: GeoJSONCollection) => void;
  /** Function to get a feature group of all markers */
  getFeatureGroup: () => L.FeatureGroup | null;
  /** Function to update popup styles based on theme */
  updatePopupStyles: (isDark: boolean) => void;
  /** Function to create a water bottle icon */
  createWaterBottleIcon: (mpn: string | number) => L.DivIcon;
  /** Function to create popup HTML content */
  createPopupContent: (feature: GeoJSONFeature) => string;
}
/**
 * Hook for managing water quality markers on a map
 * @param map - Leaflet map instance
 * @param options - Marker customization options
 * @returns Object with marker management functions
 */
export declare function useMarkers(map: Ref<L.Map | null>, options?: MarkerOptions): MarkerManager;
