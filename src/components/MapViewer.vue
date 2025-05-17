<template>
  <div class="w-full h-full">
    <!-- Map container -->
    <div id="map" class="absolute inset-0 z-0"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { analytics, AnalyticsEvent } from '../services/analytics';
import { handleError, handleAsyncOperation, ErrorSeverity } from '../utils/errorHandler';
import config from '../config';

// Import constants from configuration
const { waterQuality, map: mapConfig } = config;

// Constants for MPN threshold values
const MPN_THRESHOLD_LOW = waterQuality.mpnThresholds.low;
const MPN_THRESHOLD_MEDIUM = waterQuality.mpnThresholds.medium;

// Color constants
const COLOR_GREEN = waterQuality.colors.good;
const COLOR_YELLOW = waterQuality.colors.moderate;
const COLOR_RED = waterQuality.colors.poor;

/**
 * Function to get color based on MPN value
 * @param mpn - MPN value to evaluate
 * @returns Hex color code based on MPN threshold
 */
const getColorForMPN = (mpn: string | number | null): string => {
  if (mpn === null) {
    return COLOR_YELLOW; // Use yellow for null/unknown values
  }
  
  const mpnValue = Number(mpn);
  if (isNaN(mpnValue)) {
    console.warn('Invalid MPN value:', mpn);
    return COLOR_YELLOW; // Use yellow for invalid values
  }
  
  if (mpnValue < MPN_THRESHOLD_LOW) return COLOR_GREEN; // Green - Acceptable
  if (mpnValue <= MPN_THRESHOLD_MEDIUM) return COLOR_YELLOW; // Yellow - Caution
  return COLOR_RED; // Red - Unacceptable
};

/**
 * Function to create a custom water bottle divIcon
 * @param mpn - MPN value to determine the icon color
 * @returns Leaflet divIcon for the marker
 */
const createWaterBottleIcon = (mpn: string | number): L.DivIcon => {
  const color = getColorForMPN(mpn);

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
    popupAnchor: [0, -34],
  });
};

// TypeScript interfaces
interface MapViewerProps {
  selectedDate: string;
  isDarkMode: boolean;
}

interface SampleData {
  site: string;
  mpn: string | number;
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    site: string;
    mpn: string | number;
    sampleTime?: string;
    tideSummary?: string;
    [key: string]: any;
  };
}

interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

// Props with TypeScript validation
const props = defineProps<MapViewerProps>();

// Emits with TypeScript validation
const emit = defineEmits<{
  'update:siteCount': [count: number];
  'update:sampleData': [samples: SampleData[]];
  'update:rainfallByDayIn': [data: (number | null)[]];
  'update:rainData': [data: number[]];
  'update:totalRain': [value: number];
}>();

// Reactive references with type annotations
const mapData = ref<GeoJSONCollection | null>(null);
const map = ref<L.Map | null>(null);
const markers = ref<L.Marker[]>([]);
const tileLayer = ref<L.TileLayer | null>(null);
const hasAutoFitted = ref<boolean>(false);

// Tile layer URLs from configuration
const LIGHT_TILE_URL = mapConfig.tileUrls.light;
const DARK_TILE_URL = mapConfig.tileUrls.dark;

/**
 * Updates the map tile layer based on the current theme mode
 * Switches between light and dark map tiles
 */
const updateTileLayer = (): void => {
  if (!map.value) return;

  // Remove existing tile layer if it exists
  if (tileLayer.value) {
    map.value.removeLayer(tileLayer.value);
  }

  // Add the appropriate new tile layer based on mode
  const currentTileUrl = props.isDarkMode ? DARK_TILE_URL : LIGHT_TILE_URL;
  tileLayer.value = L.tileLayer(currentTileUrl, {
    attribution: '',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map.value);

  // Update existing popups if any
  updatePopupStyles();
};

/**
 * Updates popup styles based on current theme mode
 * Re-applies popups to markers with updated styling classes
 */
const updatePopupStyles = (): void => {
  if (!map.value) return;

  // Re-apply popups to all markers with updated styling
  markers.value.forEach(marker => {
    const popup = marker.getPopup();
    if (popup) {
      // Get the current content
      const content = popup.getContent();
      // Close and unbind the current popup
      marker.closePopup().unbindPopup();
      // Bind a new popup with the same content but updated class
      marker.bindPopup(content || '', {
        className: props.isDarkMode ? 'dark-mode-popup' : '',
      });
    }
  });
};

// Watch for changes in dark mode setting
watch(
  () => props.isDarkMode,
  newMode => {
    updateTileLayer();
    analytics.track(AnalyticsEvent.CHANGED_THEME, {
      theme: newMode ? 'dark' : 'light',
      previousTheme: newMode ? 'light' : 'dark'
    });
  }
);

// Watch for changes in selected date
watch(
  () => props.selectedDate,
  async newDate => {
    if (newDate) {
      await loadMapData(newDate);
    }
  },
  { immediate: true }
);

// Watch for changes in map data and update map
watch(mapData, newData => {
  console.log('Map data updated:', newData);
  if (newData && map.value) {
    updateMap(newData);
  }
});

// Methods
const loadMapData = async (date: string) => {
  return handleAsyncOperation(async () => {
    // Track date selection
    analytics.track(AnalyticsEvent.SELECTED_DATE, { date });

    // Always use the non-enriched version first to ensure we get data
    const dataPath = config.paths.data;
    const response = await fetch(`${import.meta.env.BASE_URL}${dataPath}/${date}.geojson`);
    if (!response.ok) {
      analytics.track(AnalyticsEvent.FAILED_LOADING_DATA, { 
        date,
        error: `${response.status} ${response.statusText}`
      });
      throw new Error(`Failed to load data for ${date}: ${response.status} ${response.statusText}`);
    }

    try {
      mapData.value = await response.json();

      // Update parent component with the site count and sample data
      if (mapData.value && mapData.value.features) {
        emit('update:siteCount', mapData.value.features.length);

        // Extract the sample data for the legend
        const samples = mapData.value.features.map(feature => ({
          site: feature.properties.site || feature.properties['Site Name'] || '',
          mpn: feature.properties.mpn || feature.properties['MPN'] || '',
        }));
        emit('update:sampleData', samples);
        
        // Extract rainfall data if available
        // First check if we have the rainfall_by_day_in array in the GeoJSON
        if (mapData.value.features.some(f => f.properties.rainfall_by_day_in && Array.isArray(f.properties.rainfall_by_day_in))) {
          // Get the first feature that has rainfall_by_day_in data
          const featureWithRainfall = mapData.value.features.find(f => 
            f.properties.rainfall_by_day_in && 
            Array.isArray(f.properties.rainfall_by_day_in)
          );
          
          if (featureWithRainfall) {
            const rainData = featureWithRainfall.properties.rainfall_by_day_in.map(val => 
              typeof val === 'number' ? val : parseFloat(val)
            );
            
            // Calculate total rain from the array
            const totalRain = rainData.reduce((sum, val) => sum + (val || 0), 0);
            
            // Emit the new data format
            emit('update:rainData', rainData);
            emit('update:totalRain', Number(totalRain.toFixed(2)));
            
            // Also emit using the legacy format for backward compatibility
            emit('update:rainfallByDayIn', rainData);
          }
        }
        // Fallback to synthetic data if no rainfall_by_day_in is available
        else if (mapData.value.features.some(f => f.properties.rainfall_mm_7day !== undefined)) {
          // Create a synthetic 7-day distribution from the average rainfall_mm_7day
          // Calculate average 7-day rainfall across all points and convert from mm to inches
          const totalRainfall = mapData.value.features.reduce((sum, feature) => {
            return sum + (feature.properties.rainfall_mm_7day || 0);
          }, 0);
          const averageRainfall = totalRainfall / mapData.value.features.length;
          
          // Convert mm to inches (1 mm = 0.0393701 inches)
          const totalRainfallInches = averageRainfall * 0.0393701;
          
          // Create a distribution over 7 days - this is synthetic data for the demo
          // In a real app, we would have daily data from the API
          const distribution = [0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05];
          const rainfallByDay = distribution.map(factor => Number((totalRainfallInches * factor).toFixed(2)));
          
          // Emit both the new and legacy data formats
          emit('update:rainData', rainfallByDay);
          emit('update:totalRain', Number(totalRainfallInches.toFixed(2)));
          emit('update:rainfallByDayIn', rainfallByDay);
        }
      } else {
        // No features found
        handleError(
          new Error(`No features found in data for ${date}`),
          { component: 'MapViewer', operation: 'loadMapData' },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
      }

      // Try to load the enriched version if available
      await handleAsyncOperation(async () => {
        const enrichedResponse = await fetch(
          `${import.meta.env.BASE_URL}${dataPath}/${date}.enriched.geojson`
        );
        if (enrichedResponse.ok) {
          const enrichedData = await enrichedResponse.json();
          mapData.value = enrichedData;
        }
      }, 
      { component: 'MapViewer', operation: 'loadEnrichedData' }, 
      { reportToAnalytics: true, showToUser: false });

    } catch (jsonError) {
      // Handle JSON parsing errors
      handleError(
        jsonError,
        { component: 'MapViewer', operation: 'parseMapData', data: { date } },
        ErrorSeverity.ERROR,
        { 
          reportToAnalytics: true, 
          showToUser: false,
          rethrow: true 
        }
      );
    }
  }, 
  { component: 'MapViewer', operation: 'loadMapData', data: { date } },
  { 
    reportToAnalytics: true, 
    showToUser: false 
  });
}

/**
 * Updates the map with new GeoJSON data
 * Clears existing markers and adds new ones based on the data
 * @param data - GeoJSON collection containing sample data
 */
const updateMap = (data: GeoJSONCollection): void => {
  if (!map.value) {
    console.error('Map instance is not available');
    return;
  }

  console.log('Updating map with data:', data);
  console.log('Features count:', data.features ? data.features.length : 0);

  // Store current view state before updating markers
  let previousCenter = map.value.getCenter();
  let previousZoom = map.value.getZoom();

  // Clear existing markers
  for (const marker of markers.value) {
    marker.remove();
  }
  markers.value = [];

  // Add new markers
  if (!data.features || data.features.length === 0) {
    console.warn('No features found in data');
    return;
  }

  let markersAdded = 0;

  for (const feature of data.features) {
    try {
      if (
        !feature.geometry ||
        !feature.geometry.coordinates ||
        feature.geometry.coordinates.length < 2
      ) {
        handleError(
          new Error('Invalid feature geometry or coordinates'),
          { component: 'MapViewer', operation: 'updateMap', data: { feature } },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        continue;
      }

      if (!feature.properties) {
        handleError(
          new Error('Missing properties in feature'),
          { component: 'MapViewer', operation: 'updateMap', data: { feature } },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        console.warn('Skipping feature with missing properties:', feature);
        continue;
      }
      
      // Extract properties with support for different case formats
      const siteName = feature.properties.site || feature.properties['Site Name'] || '';
      const mpnValue = feature.properties.mpn !== undefined ? feature.properties.mpn : feature.properties['MPN'];
      const sampleTimeValue = feature.properties.sampleTime || feature.properties['Sample Time'] || '';
      
      // Skip if we couldn't find MPN at all
      if (mpnValue === undefined) {
        console.warn('Feature is missing MPN property:', feature);
        continue;
      }

      const coords = feature.geometry.coordinates;
      const lat = coords[1];
      const lng = coords[0];

      if (isNaN(lat) || isNaN(lng)) {
        handleError(
          new Error('Invalid coordinates (NaN values)'),
          { component: 'MapViewer', operation: 'updateMap', data: { coordinates: coords } },
          ErrorSeverity.WARNING,
          { showToUser: false }
        );
        continue;
      }

      // Extract properties with correct field names (handle both formats)
      const site = feature.properties.site || feature.properties['Site Name'] || '';
      const mpn = feature.properties.mpn || feature.properties['MPN'] || '';
      const sampleTime = feature.properties.sampleTime || feature.properties['Sample Time'] || '';

      // Create water bottle icon
      const bottleIcon = createWaterBottleIcon(mpn);

      // Update the popupAnchor to increase distance from the icon
      bottleIcon.options.popupAnchor = [0, -40];

      // Determine quality message
      let qualityColor, qualityMessage;
      // Use the mpnValue we already extracted and validated
      const mpnNumber = Number(mpnValue);

      if (mpnNumber < 35) {
        qualityColor = 'text-lime-500';
        qualityMessage = 'Acceptable for swimming';
      } else if (mpnNumber <= 104) {
        qualityColor = 'text-yellow-400';
        qualityMessage = 'Unacceptable if levels persist';
      } else {
        qualityColor = 'text-red-500';
        qualityMessage = 'Unacceptable for swimming';
      }

      // Create simple popup content with sanitized values
      const sanitize = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
        
      const sanitizedSite = sanitize(siteName);
      const sanitizedMpn = sanitize(mpnValue === null ? 'N/A' : mpnValue.toString());
      
      let popupContent = `
        <div class="site-popup">
          <div class="font-semibold text-lg site-name">${sanitizedSite}</div>
          <div class="mt-2 ${qualityColor} font-medium text-base">
            ${sanitizedMpn} MPN/100mL
          </div>
          <div class="mt-1 text-sm opacity-75">
            ${qualityMessage}
          </div>
      `;

      // Add sample time if available
      if (sampleTimeValue) {
        const sanitizedSampleTime = sanitize(sampleTimeValue);
        popupContent += `<div class="text-xs opacity-75 mt-1">Sampled at ${sanitizedSampleTime}</div>`;
      }

      // Add tide and rainfall info section header if either is available
      if (feature.properties.tideSummary || feature.properties.rainfall_mm_7day !== undefined) {
        popupContent += `<div class="text-xs font-medium mt-3 pt-2 border-t border-gray-200">Environmental Conditions:</div>`;
      }
      
      // Add tide info if available - with conditional formatting
      if (feature.properties.tideSummary) {
        // Parse the tide summary
        const tideSummary = feature.properties.tideSummary;
        let displaySummary = tideSummary;

        // For intuitive combinations, show only the tide state (no direction at all)
        if (tideSummary.includes('Low Tide – ⬇️ Falling')) {
          // Extract just the "Low Tide" part and the station
          const stationInfo = tideSummary.includes('(')
            ? tideSummary.substring(tideSummary.indexOf('('))
            : '';
          displaySummary = `Low Tide ${stationInfo}`;
        } else if (tideSummary.includes('High Tide – ⬆️ Rising')) {
          // Extract just the "High Tide" part and the station
          const stationInfo = tideSummary.includes('(')
            ? tideSummary.substring(tideSummary.indexOf('('))
            : '';
          displaySummary = `High Tide ${stationInfo}`;
        }

        const sanitizedTideSummary = sanitize(displaySummary);
        popupContent += `<div class="text-xs opacity-75 mt-1">
          <span title="Tidal data is taken from nearest NOAA station and is only approximate">${sanitizedTideSummary}</span>
        </div>`;
      }
      
      // Add rainfall info if available
      if (feature.properties.rainfall_mm_7day !== undefined && feature.properties.rainfall_mm_7day !== null) {
        const rainfallValue = feature.properties.rainfall_mm_7day;
        const rainfallText = `${rainfallValue} mm (7-day)`;
        const sanitizedRainfall = sanitize(rainfallText);
        
        popupContent += `<div class="text-xs opacity-75 mt-1">
          <span title="Rainfall data for the 7 days prior to sample date from Open-Meteo API">${sanitizedRainfall}</span>
        </div>`;
        
        // Add rainfall station name if available
        if (feature.properties.rainfall_station_name) {
          const stationName = feature.properties.rainfall_station_name;
          const sanitizedStationName = sanitize(stationName);
          popupContent += `<div class="text-xs opacity-75 mt-1">
            <span title="Weather station providing rainfall data">Station: ${sanitizedStationName}</span>
          </div>`;
        }
      }

      // Close the popup div
      popupContent += `</div>`;

      // Create and add the marker
      const marker = L.marker([lat, lng], { icon: bottleIcon })
        .bindPopup(popupContent, {
          className: props.isDarkMode ? 'dark-mode-popup' : '',
        })
        .addTo(map.value);

      // Add popup open event tracking
      marker.on('popupopen', () => {
        analytics.track(AnalyticsEvent.VIEWED_SAMPLE_PIN, {
          sampleId: site,
          result: mpn.toString(),
          location: `${lat.toFixed(4)},${lng.toFixed(4)}`
        });
      });

      markers.value.push(marker);
      markersAdded++;
    } catch (error) {
      handleError(
        error,
        { component: 'MapViewer', operation: 'processFeature' },
        ErrorSeverity.ERROR,
        { 
          logToConsole: true,
          reportToAnalytics: true,
          showToUser: false
        }
      );
    }
  }

  // Handle map positioning
  if (markers.value.length > 0) {
    if (!hasAutoFitted.value) {
      // First load: auto-fit to bounds
      const group = L.featureGroup(markers.value);
      map.value.fitBounds(group.getBounds(), { padding: [30, 30] });
      hasAutoFitted.value = true;
    } else {
      // Subsequent loads: maintain previous view
      map.value.setView(previousCenter, previousZoom);
    }
  } else {
  }
};

onMounted(() => {
  // Initialize map with coordinates from configuration
  map.value = L.map('map').setView(
    [mapConfig.defaultLatitude, mapConfig.defaultLongitude], 
    mapConfig.defaultZoom
  );

  // Initialize tile layer using our updateTileLayer function
  updateTileLayer();

  // Add map interaction analytics with debouncing
  let zoomTimeout: number | undefined;
  map.value.on('zoomend', () => {
    // Clear any existing timeout
    if (zoomTimeout) {
      window.clearTimeout(zoomTimeout);
    }
    
    // Set a new timeout to avoid sending too many events
    zoomTimeout = window.setTimeout(() => {
      analytics.track(AnalyticsEvent.ZOOMED_MAP, {
        zoomLevel: map.value?.getZoom() || 0,
      });
    }, 500); // 500ms debounce
  });

  let panTimeout: number | undefined;
  map.value.on('moveend', () => {
    // Clear any existing timeout
    if (panTimeout) {
      window.clearTimeout(panTimeout);
    }
    
    // Set a new timeout to avoid sending too many events
    panTimeout = window.setTimeout(() => {
      const center = map.value?.getCenter();
      if (center) {
        analytics.track(AnalyticsEvent.PANNED_MAP, {
          center: {
            lat: Number(center.lat.toFixed(4)),
            lng: Number(center.lng.toFixed(4)),
          }
        });
      }
    }, 500); // 500ms debounce
  });

  // Remove zoom control
  map.value.removeControl(map.value.zoomControl);

  // Load map data if we have a selected date
  if (props.selectedDate) {
    loadMapData(props.selectedDate);
  }
});

onUnmounted(() => {
  // Clean up map instance when component is unmounted
  if (map.value) {
    map.value.remove();
  }
});
</script>

<style>
/* Import leaflet css in your component */
@import 'leaflet/dist/leaflet.css';

/* Add custom styles for the map */
#map {
  height: 100%;
  width: 100%;
  z-index: 0;
}

/* Ensure Leaflet tiles display correctly */
.leaflet-tile-pane {
  z-index: 0;
}

.leaflet-control-container {
  z-index: 10;
}

/* Style for the water bottle icons */
.water-bottle-icon {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}

/* Style the popup to match the app design */
/* Dark mode popup styles will be applied via JS in updatePopupStyle */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.2);
  padding: 0;
}

.leaflet-popup-content {
  margin: 18px 20px;
  font-family: inherit;
  line-height: 1.5;
  min-width: 180px;
}

/* Fix close button position */
.leaflet-popup-close-button {
  top: 8px !important;
  right: 8px !important;
  color: inherit !important;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  width: 18px !important;
  height: 18px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.leaflet-popup-close-button:hover {
  opacity: 1;
  background: transparent !important;
}

/* Site popup styling */
.site-popup {
  padding: 4px 2px;
}

.site-popup .site-name {
  word-wrap: break-word;
  max-width: 250px;
}

/* Quality indicators */
.site-popup .text-lime-500 {
  color: #84cc16;
}

.site-popup .text-yellow-400 {
  color: #facc15;
}

.site-popup .text-red-500 {
  color: #ef4444;
}

/* Light mode styles (default) */
.leaflet-popup-content-wrapper {
  background-color: rgba(255, 255, 255, 0.95);
  color: #1f2937;
}

.site-popup .opacity-75 {
  color: #6b7280; /* text-gray-500 */
}

/* Ensure consistent spacing between popup elements */
.site-popup .mt-1 {
  margin-top: 0.375rem;
}

.site-popup .mt-2 {
  margin-top: 0.75rem;
}

/* Dark mode styles (applied via JS) */
.dark-mode-popup .leaflet-popup-content-wrapper {
  background-color: rgb(31, 41, 55);
  color: rgb(209, 213, 219);
}

.dark-mode-popup .leaflet-popup-tip {
  background-color: rgb(31, 41, 55);
}

.dark-mode-popup .site-popup .opacity-75 {
  color: #9ca3af; /* text-gray-400 */
}

.dark-mode-popup .leaflet-popup-close-button {
  color: rgb(209, 213, 219) !important;
}

/* Hide or minimize any remaining attribution text */
.leaflet-control-attribution {
  display: none;
}
</style>
