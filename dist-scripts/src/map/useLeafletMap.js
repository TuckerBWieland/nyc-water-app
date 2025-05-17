/**
 * Composable for Leaflet map functionality with TypeScript support
 */
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import config from '../config';
import { analytics, AnalyticsEvent } from '../analytics';
// Map defaults from configuration
const { map: mapConfig } = config;
/**
 * Composable function for managing a Leaflet map
 * @param options - Configuration options for map
 * @returns Object with map instance and utility functions
 */
export function useLeafletMap(options) {
  const {
    elementId,
    lat = mapConfig.defaultLatitude,
    lng = mapConfig.defaultLongitude,
    zoom = mapConfig.defaultZoom,
    isDarkMode = false,
    trackAnalytics = true,
    zoomControls = false,
  } = options;
  // Reactive references
  const instance = ref(null);
  const tileLayer = ref(null);
  const markers = ref([]);
  const hasAutoFitted = ref(false);
  /**
   * Set the appropriate tile layer based on theme
   * @param isDark - Whether dark mode is enabled
   */
  const updateTileLayer = isDark => {
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
  const initializeMap = () => {
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
      console.error('Failed to initialize map', error);
    }
  };
  /**
   * Set up map interaction analytics with debouncing
   */
  const setupAnalytics = () => {
    if (!instance.value) return;
    // Track zoom events with debouncing
    let zoomTimeout;
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
    let panTimeout;
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
              },
            });
          }
        }
      }, 500); // 500ms debounce
    });
  };
  /**
   * Clear all markers from the map
   */
  const clearMarkers = () => {
    if (!instance.value) return;
    for (const marker of markers.value) {
      marker.remove();
    }
    markers.value = [];
  };
  /**
   * Fit the map view to contain all markers
   */
  const fitToMarkers = () => {
    if (!instance.value || markers.value.length === 0) return;
    const group = L.featureGroup(markers.value);
    instance.value.fitBounds(group.getBounds(), { padding: [30, 30] });
    hasAutoFitted.value = true;
  };
  /**
   * Get the current center of the map
   * @returns The center coordinates or undefined if map not initialized
   */
  const getCenter = () => {
    return instance.value?.getCenter();
  };
  /**
   * Get the current zoom level of the map
   * @returns The zoom level or undefined if map not initialized
   */
  const getZoom = () => {
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
    getZoom,
  };
}
