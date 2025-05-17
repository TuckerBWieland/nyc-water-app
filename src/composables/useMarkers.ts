// @ts-nocheck
/**
 * Composable for Leaflet marker management with water quality styling
 */
import { ref, Ref } from 'vue';
import L from 'leaflet';
import { handleError, ErrorSeverity } from '../utils/errorHandler';
import { analytics, AnalyticsEvent } from '../services/analytics';
import config from '../config';
import { GeoJSONFeature, GeoJSONCollection } from '../types/geojson';

/** Water quality rating enumeration */
export enum WaterQuality {
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
export function getMpnRating(
  mpn: string | number,
  lowThreshold = config.waterQuality.mpnThresholds.low,
  mediumThreshold = config.waterQuality.mpnThresholds.medium
): WaterQuality {
  const mpnValue = Number(mpn);

  if (mpnValue < lowThreshold) {
    return WaterQuality.GOOD;
  } else if (mpnValue <= mediumThreshold) {
    return WaterQuality.MODERATE;
  } else {
    return WaterQuality.POOR;
  }
}

/**
 * Get color for MPN value based on water quality rating
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns Hex color code for the water quality
 */
export function getColorForMPN(
  mpn: string | number,
  lowThreshold = config.waterQuality.mpnThresholds.low,
  mediumThreshold = config.waterQuality.mpnThresholds.medium
): string {
  const quality = getMpnRating(mpn, lowThreshold, mediumThreshold);

  switch (quality) {
    case WaterQuality.GOOD:
      return config.waterQuality.colors.good;
    case WaterQuality.MODERATE:
      return config.waterQuality.colors.moderate;
    case WaterQuality.POOR:
      return config.waterQuality.colors.poor;
    default:
      return config.waterQuality.colors.poor;
  }
}

/**
 * Get quality message based on MPN value
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns Descriptive message for the water quality
 */
export function getQualityMessage(
  mpn: string | number,
  lowThreshold = config.waterQuality.mpnThresholds.low,
  mediumThreshold = config.waterQuality.mpnThresholds.medium
): string {
  const quality = getMpnRating(mpn, lowThreshold, mediumThreshold);

  switch (quality) {
    case WaterQuality.GOOD:
      return 'Acceptable for swimming';
    case WaterQuality.MODERATE:
      return 'Unacceptable if levels persist';
    case WaterQuality.POOR:
      return 'Unacceptable for swimming';
    default:
      return 'Unacceptable for swimming';
  }
}

/**
 * Get CSS class for MPN value
 * @param mpn - MPN value to evaluate
 * @param lowThreshold - Good water quality threshold
 * @param mediumThreshold - Moderate water quality threshold
 * @returns CSS class for the water quality
 */
export function getQualityClass(
  mpn: string | number,
  lowThreshold = config.waterQuality.mpnThresholds.low,
  mediumThreshold = config.waterQuality.mpnThresholds.medium
): string {
  const quality = getMpnRating(mpn, lowThreshold, mediumThreshold);

  switch (quality) {
    case WaterQuality.GOOD:
      return 'text-lime-500';
    case WaterQuality.MODERATE:
      return 'text-yellow-400';
    case WaterQuality.POOR:
      return 'text-red-500';
    default:
      return 'text-red-500';
  }
}

/**
 * Sanitize string for use in HTML
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Hook for managing water quality markers on a map
 * @param map - Leaflet map instance
 * @param options - Marker customization options
 * @returns Object with marker management functions
 */
export function useMarkers(map: Ref<L.Map | null>, options: MarkerOptions = {}) {
  // Extract options with defaults
  const {
    trackAnalytics = true,
    isDarkMode = false,
    lowThreshold = config.waterQuality.mpnThresholds.low,
    mediumThreshold = config.waterQuality.mpnThresholds.medium,
  } = options;

  // State
  const markers = ref<any[]>([]); // Using any type to avoid Leaflet typing issues
  const markerCount = ref<number>(0);
  const processedFeatures = ref<number>(0);

  /**
   * Create a water bottle icon based on MPN value
   * @param mpn - MPN value for determining color
   * @returns Leaflet divIcon configured as a water bottle
   */
  const createWaterBottleIcon = (mpn: string | number): L.DivIcon => {
    const color = getColorForMPN(mpn, lowThreshold, mediumThreshold);

    return L.divIcon({
      html: `
        <div style="width: 16px; height: 32px; color: ${color}">
          <svg viewBox="0 0 32 64" xmlns="http://www.w3.org/2000/svg" width="16" height="32">
            <!-- Cap -->
            <rect x="8" y="2" width="16" height="6" rx="2" fill="#ccc" stroke="black" stroke-width="0.5"/>
            
            <!-- Neck -->
            <rect x="10" y="8" width="12" height="4" rx="2" fill="#eee" stroke="black" stroke-width="0.5"/>

            <!-- Body -->
            <rect x="6" y="12" width="20" height="44" rx="6" fill="currentColor" stroke="white" stroke-width="1"/>

            <!-- Bottom ring -->
            <ellipse cx="16" cy="58" rx="8" ry="2" fill="white" opacity="0.2"/>
          </svg>
        </div>
      `,
      className: 'water-bottle-icon',
      iconSize: [16, 32],
      iconAnchor: [8, 32],
      popupAnchor: [0, -40],
    });
  };

  /**
   * Create popup content for a water sample marker
   * @param feature - GeoJSON feature with water sample data
   * @returns HTML string for the popup content
   */
  const createPopupContent = (feature: GeoJSONFeature): string => {
    const { properties } = feature;
    const { site, mpn, sampleTime, tideSummary } = properties;

    // Sanitize data for security
    const sanitizedSite = sanitizeHtml(site);
    const sanitizedMpn = sanitizeHtml(mpn.toString());

    // Determine quality styling
    const qualityClass = getQualityClass(mpn, lowThreshold, mediumThreshold);
    const qualityMessage = getQualityMessage(mpn, lowThreshold, mediumThreshold);

    // Create base popup content
    let popupContent = `
      <div class="site-popup">
        <div class="font-semibold text-lg site-name">${sanitizedSite}</div>
        <div class="mt-2 ${qualityClass} font-medium text-base">
          ${sanitizedMpn} MPN/100mL
        </div>
        <div class="mt-1 text-sm opacity-75">
          ${qualityMessage}
        </div>
    `;

    // Add sample time if available
    if (sampleTime) {
      const sanitizedSampleTime = sanitizeHtml(sampleTime);
      popupContent += `<div class="text-xs opacity-75 mt-1">Sampled at ${sanitizedSampleTime}</div>`;
    }

    // Add tide info if available
    if (tideSummary) {
      // Parse the tide summary
      const tideSummaryStr = tideSummary.toString();
      let displaySummary = tideSummaryStr;

      // For intuitive combinations, simplify display
      if (tideSummaryStr.includes('Low Tide – ⬇️ Falling')) {
        const stationInfo = tideSummaryStr.includes('(')
          ? tideSummaryStr.substring(tideSummaryStr.indexOf('('))
          : '';
        displaySummary = `Low Tide ${stationInfo}`;
      } else if (tideSummaryStr.includes('High Tide – ⬆️ Rising')) {
        const stationInfo = tideSummaryStr.includes('(')
          ? tideSummaryStr.substring(tideSummaryStr.indexOf('('))
          : '';
        displaySummary = `High Tide ${stationInfo}`;
      }

      const sanitizedTideSummary = sanitizeHtml(displaySummary);
      popupContent += `<div class="text-xs opacity-75 mt-1" title="Tidal data is taken from nearest NOAA station and is only approximate">${sanitizedTideSummary}</div>`;
    }

    // Close the popup div
    popupContent += `</div>`;

    return popupContent;
  };

  /**
   * Add a marker for a GeoJSON feature
   * @param feature - GeoJSON feature with water sample data
   * @returns The created marker or null if invalid
   */
  const addMarker = (feature: GeoJSONFeature): L.Marker | null => {
    if (!map.value) return null;

    try {
      processedFeatures.value++;

      // Validate feature has required data
      if (
        !feature.geometry ||
        !feature.geometry.coordinates ||
        feature.geometry.coordinates.length < 2
      ) {
        handleError(
          new Error('Invalid feature geometry or coordinates'),
          { component: 'useMarkers', operation: 'addMarker' },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        return null;
      }

      if (!feature.properties || !feature.properties.mpn) {
        handleError(
          new Error('Missing required properties in feature'),
          { component: 'useMarkers', operation: 'addMarker' },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        return null;
      }

      // Extract coordinates and properties
      const coords = feature.geometry.coordinates;
      const lat = coords[1];
      const lng = coords[0];

      if (isNaN(lat) || isNaN(lng)) {
        handleError(
          new Error('Invalid coordinates (NaN values)'),
          { component: 'useMarkers', operation: 'addMarker' },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        return null;
      }

      const { site, mpn } = feature.properties;

      // Create water bottle icon
      const bottleIcon = createWaterBottleIcon(mpn);

      // Create popup content
      const popupContent = createPopupContent(feature);

      // Create and add the marker
      const marker = L.marker([lat, lng], { icon: bottleIcon })
        .bindPopup(popupContent, {
          className: isDarkMode ? 'dark-mode-popup' : '',
        })
        .addTo(map.value);

      // Track analytics for popup opens
      if (trackAnalytics) {
        marker.on('popupopen', () => {
          analytics.track(AnalyticsEvent.VIEWED_SAMPLE_PIN, {
            sampleId: site,
            result: mpn.toString(),
            location: `${lat.toFixed(4)},${lng.toFixed(4)}`,
          });
        });
      }

      // Add to markers array
      markers.value.push(marker);
      markerCount.value++;

      return marker;
    } catch (error) {
      handleError(error, { component: 'useMarkers', operation: 'addMarker' }, ErrorSeverity.ERROR, {
        logToConsole: true,
        reportToAnalytics: true,
      });
      return null;
    }
  };

  /**
   * Clear all markers from the map
   */
  const clearMarkers = (): void => {
    if (!map.value) return;

    markers.value.forEach((marker: L.Marker) => marker.remove());
    markers.value = [];
    markerCount.value = 0;
    processedFeatures.value = 0;
  };

  /**
   * Update markers from GeoJSON collection
   * @param collection - GeoJSON collection with features
   */
  const updateFromGeoJSON = (collection: GeoJSONCollection): void => {
    if (!map.value || !collection.features) return;

    // Clear existing markers
    clearMarkers();

    // Add markers for all features
    for (const feature of collection.features) {
      addMarker(feature);
    }
  };

  /**
   * Create a featureGroup from all markers for operations like fitting bounds
   * @returns Leaflet featureGroup containing all markers
   */
  const getFeatureGroup = (): L.FeatureGroup | null => {
    if (markers.value.length === 0) return null;
    return L.featureGroup(markers.value as L.Layer[]);
  };

  /**
   * Update popup styling based on dark mode setting
   * @param isDark - Whether dark mode is enabled
   */
  const updatePopupStyles = (isDark: boolean): void => {
    if (!map.value) return;

    // Re-apply popups to all markers with updated styling
    markers.value.forEach((marker: L.Marker) => {
      const popup = marker.getPopup();
      if (popup) {
        // Get the current content
        const content = popup.getContent();
        // Close and unbind the current popup
        marker.closePopup().unbindPopup();
        // Bind a new popup with the same content but updated class
        marker.bindPopup(content || '', {
          className: isDark ? 'dark-mode-popup' : '',
        });
      }
    });
  };

  return {
    markers,
    markerCount,
    processedFeatures,
    addMarker,
    clearMarkers,
    updateFromGeoJSON,
    getFeatureGroup,
    updatePopupStyles,
    createWaterBottleIcon,
    createPopupContent,
  };
}
