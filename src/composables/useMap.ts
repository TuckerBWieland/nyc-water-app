// @ts-nocheck
/**
 * Composable for Leaflet map functionality with TypeScript support
 */
import { ref, onMounted, onUnmounted, watch, Ref } from 'vue';
import L from 'leaflet';
import config from '../config';
import { analytics, AnalyticsEvent } from '../services/analytics';
import { handleError, ErrorSeverity } from '../utils/errorHandler';

// Map defaults from configuration
const { map: mapConfig } = config;

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

export interface MapRef {
  /** The Leaflet map instance */
  instance: Ref<L.Map | null>;
  /** The current tile layer */
  tileLayer: Ref<L.TileLayer | null>;
  /** The markers on the map */
  markers: Ref<any[]>; // Using any to avoid Leaflet typing issues
  /** Whether the map has been fitted to bounds */
  hasAutoFitted: Ref<boolean>;
  /** Function to update the tile layer based on theme */
  updateTheme: (isDark: boolean) => void;
  /** Function to clear all markers */
  clearMarkers: () => void;
  /** Function to fit to all markers */
  fitToMarkers: () => void;
  /** Function to get the current center */
  getCenter: () => L.LatLng | undefined;
  /** Function to get the current zoom level */
  getZoom: () => number | undefined;
}

/**
 * Composable function for managing a Leaflet map
 * @param options - Configuration options for map
 * @returns Object with map instance and utility functions
 */
export function useMap(options: MapOptions): MapRef {
  const {
    elementId,
    lat = mapConfig.defaultLatitude,
    lng = mapConfig.defaultLongitude,
    zoom = mapConfig.defaultZoom,
    isDarkMode = false,
    trackAnalytics = true,
    zoomControls = false
  } = options;

  // Reactive references
  const instance = ref<L.Map | null>(null);
  const tileLayer = ref<L.TileLayer | null>(null);
  const markers = ref<any[]>([]); // Using any to avoid Leaflet typing issues
  const hasAutoFitted = ref<boolean>(false);

  /**
   * Set the appropriate tile layer based on theme
   * @param isDark - Whether dark mode is enabled
   */
  const updateTileLayer = (isDark: boolean): void => {
    if (!instance.value) return;

    // Remove existing tile layer if it exists
    if (tileLayer.value) {
      instance.value.removeLayer(tileLayer.value);
    }

    // Add the appropriate new tile layer based on mode
    const currentTileUrl = isDark ? mapConfig.tileUrls.dark : mapConfig.tileUrls.light;
    tileLayer.value = L.tileLayer(currentTileUrl, {
      attribution: '',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(instance.value);
  };

  /**
   * Initialize the Leaflet map
   */
  const initializeMap = (): void => {
    try {
      // Create map instance
      instance.value = L.map(elementId).setView([lat, lng], zoom);

      // Set initial tile layer
      updateTileLayer(isDarkMode);

      // Add analytics tracking with debouncing if enabled
      if (trackAnalytics) {
        setupAnalytics();
      }

      // Handle zoom controls
      if (!zoomControls && instance.value && instance.value.zoomControl) {
        instance.value.removeControl(instance.value.zoomControl);
      }
    } catch (error) {
      handleError(
        error,
        { component: 'useMap', operation: 'initializeMap' },
        ErrorSeverity.ERROR,
        { logToConsole: true, reportToAnalytics: true }
      );
    }
  };

  /**
   * Set up map interaction analytics with debouncing
   */
  const setupAnalytics = (): void => {
    if (!instance.value) return;

    // Track zoom events with debouncing
    let zoomTimeout: number | undefined;
    instance.value.on('zoomend', () => {
      // Clear any existing timeout
      if (zoomTimeout) {
        window.clearTimeout(zoomTimeout);
      }
      
      // Set a new timeout to avoid sending too many events
      zoomTimeout = window.setTimeout(() => {
        if (instance.value) {
          analytics.track(AnalyticsEvent.ZOOMED_MAP, {
            zoomLevel: instance.value.getZoom() || 0,
          });
        }
      }, 500); // 500ms debounce
    });

    // Track pan events with debouncing
    let panTimeout: number | undefined;
    instance.value.on('moveend', () => {
      // Clear any existing timeout
      if (panTimeout) {
        window.clearTimeout(panTimeout);
      }
      
      // Set a new timeout to avoid sending too many events
      panTimeout = window.setTimeout(() => {
        if (instance.value) {
          const center = instance.value.getCenter();
          if (center) {
            analytics.track(AnalyticsEvent.PANNED_MAP, {
              center: {
                lat: Number(center.lat.toFixed(4)),
                lng: Number(center.lng.toFixed(4)),
              }
            });
          }
        }
      }, 500); // 500ms debounce
    });
  };

  /**
   * Clear all markers from the map
   */
  const clearMarkers = (): void => {
    if (!instance.value) return;

    for (const marker of markers.value) {
      marker.remove();
    }
    markers.value = [];
  };

  /**
   * Fit the map view to contain all markers
   */
  const fitToMarkers = (): void => {
    if (!instance.value || markers.value.length === 0) return;

    const group = L.featureGroup(markers.value as L.Layer[]);
    instance.value.fitBounds(group.getBounds(), { padding: [30, 30] });
    hasAutoFitted.value = true;
  };

  /**
   * Get the current center of the map
   * @returns The center coordinates or undefined if map not initialized
   */
  const getCenter = (): L.LatLng | undefined => {
    return instance.value?.getCenter();
  };

  /**
   * Get the current zoom level of the map
   * @returns The zoom level or undefined if map not initialized
   */
  const getZoom = (): number | undefined => {
    return instance.value?.getZoom();
  };

  /**
   * Lifecycle hook: Initialize map on component mount
   */
  onMounted(() => {
    initializeMap();
  });

  /**
   * Lifecycle hook: Clean up map on component unmount
   */
  onUnmounted(() => {
    // Clean up map instance
    if (instance.value) {
      instance.value.remove();
      instance.value = null;
    }
  });

  // Return the map reference and utility functions
  return {
    instance,
    tileLayer,
    markers,
    hasAutoFitted,
    updateTheme: updateTileLayer,
    clearMarkers,
    fitToMarkers,
    getCenter,
    getZoom
  };
}