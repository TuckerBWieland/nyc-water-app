<template>
  <div class="w-full h-full">
    <!-- Map container -->
    <div id="map" class="absolute inset-0"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { track, EVENT_CLICK_SITE_MARKER } from '../services/analytics';

// Constants for MPN threshold values
const MPN_THRESHOLD_LOW = 35;
const MPN_THRESHOLD_MEDIUM = 104;

// Color constants
const COLOR_GREEN = '#22c55e';
const COLOR_YELLOW = '#facc15';
const COLOR_RED = '#ef4444';

// Tile layer URLs
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default {
  name: 'MapViewer',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
    geojson: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    // Reactive references
    const map = ref(null);
    const markers = ref([]);
    const tileLayer = ref(null);
    const hasAutoFitted = ref(false);

    /**
     * Function to get color based on MPN value
     * @param {string|number|null} mpn - MPN value to evaluate
     * @returns {string} Hex color code based on MPN threshold
     */
    const getColorForMPN = mpn => {
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
     * @param {string|number} mpn - MPN value to determine the icon color
     * @returns {L.DivIcon} Leaflet divIcon for the marker
     */
    const createWaterBottleIcon = mpn => {
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

    /**
     * Updates the map tile layer based on the current theme mode
     * Switches between light and dark map tiles
     */
    const updateTileLayer = () => {
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
    const updatePopupStyles = () => {
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
      () => {
        updateTileLayer();
      }
    );

    // Watch for changes in GeoJSON data
    watch(
      () => props.geojson,
      newData => {
        if (newData && map.value) {
          updateMap(newData);
        }
      },
      { immediate: true }
    );

    /**
     * Updates the map with new GeoJSON data
     * Clears existing markers and adds new ones based on the data
     * @param {Object} data - GeoJSON collection containing sample data
     */
    const updateMap = data => {
      if (!map.value) {
        console.error('Map instance is not available');
        return;
      }

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

      // Log total number of features
      console.log(`Total features on map: ${data.features.length}`);

      for (const feature of data.features) {
        try {
          if (
            !feature.geometry ||
            !feature.geometry.coordinates ||
            feature.geometry.coordinates.length < 2
          ) {
            console.warn('Invalid feature geometry or coordinates');
            continue;
          }

          if (!feature.properties) {
            console.warn('Missing properties in feature');
            continue;
          }

          // Extract properties
          const siteName = feature.properties.siteName || '';
          const mpnValue = feature.properties.mpn;
          const sampleTimeValue = feature.properties.sampleTime || '';

          // Skip if we couldn't find MPN
          if (mpnValue === undefined) {
            console.warn('Feature is missing MPN property:', feature);
            continue;
          }

          const coords = feature.geometry.coordinates;
          const lat = coords[1];
          const lng = coords[0];

          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinates (NaN values)');
            continue;
          }

          // Create water bottle icon
          const bottleIcon = createWaterBottleIcon(mpnValue);

          // Update the popupAnchor to increase distance from the icon
          bottleIcon.options.popupAnchor = [0, -40];

          // Determine quality message
          let qualityColor, qualityMessage;
          const mpnNumber = Number(mpnValue);

          if (mpnNumber < 35) {
            qualityColor = 'text-green-500';
            qualityMessage = 'Acceptable for swimming';
          } else if (mpnNumber <= 104) {
            qualityColor = 'text-yellow-400';
            qualityMessage = 'Unacceptable if levels persist';
          } else {
            qualityColor = 'text-red-500';
            qualityMessage = 'Unacceptable for swimming';
          }

          // Create simple popup content with sanitized values
          const sanitize = str =>
            String(str)
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
            // Convert ISO string to simple time like "8:46 AM" using UTC to avoid timezone shifts
            let simpleTime = sampleTimeValue;
            try {
              const date = new Date(sampleTimeValue);
              simpleTime = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'UTC',
              });
            } catch (e) {
              // Fallback to original value if parsing fails
            }

            const sanitizedSampleTime = sanitize(simpleTime);
            popupContent += `<div class="text-xs opacity-75 mt-1">Sampled at ${sanitizedSampleTime}</div>`;
          }

          // Add seasonal history if available
          if (
            feature.properties.goodCount !== undefined &&
            feature.properties.cautionCount !== undefined &&
            feature.properties.poorCount !== undefined
          ) {
            const good = sanitize(feature.properties.goodCount);
            const caution = sanitize(feature.properties.cautionCount);
            const poor = sanitize(feature.properties.poorCount);
            popupContent += `<div class="text-xs opacity-75 mt-1">This season: ${good} good, ${caution} caution, ${poor} poor</div>`;
          }

          // Add tide and rainfall info section header if either is available
          if (feature.properties.tide || feature.properties.rainfall_mm_7day !== undefined) {
            popupContent += `<div class="text-xs font-medium mt-3 pt-2 border-t border-gray-200">Environmental Conditions:</div>`;
          }

          // Add tide info if available
          if (feature.properties.tide) {
            const sanitizedTideSummary = sanitize(feature.properties.tide);
            popupContent += `<div class="text-xs opacity-75 mt-1">
              <span title="Tidal data is taken from nearest NOAA station and is only approximate">${sanitizedTideSummary}</span>
            </div>`;
          }

          // Add rainfall info if available
          if (
            feature.properties.rainfall_mm_7day !== undefined &&
            feature.properties.rainfall_mm_7day !== null
          ) {
            const mm = feature.properties.rainfall_mm_7day || 0;
            // Convert mm to inches (1 mm = 0.0393701 inches)
            const inches = Number((mm * 0.0393701).toFixed(2));
            const rainfallText = `${inches} in (7-day)`;
            const sanitizedRainfall = sanitize(rainfallText);

            popupContent += `<div class="text-xs opacity-75 mt-1">
              <span title="Rainfall data for the 7 days prior to sample date">Rainfall: ${sanitizedRainfall}</span>
            </div>`;
          }

          // Close the popup div
          popupContent += `</div>`;

          // Create and add the marker
          const marker = L.marker([lat, lng], { icon: bottleIcon })
            .bindPopup(popupContent, {
              className: props.isDarkMode ? 'dark-mode-popup' : '',
            })
            .addTo(map.value);

          marker.on('click', () => {
            track(EVENT_CLICK_SITE_MARKER, { site_name: siteName });
          });

          markers.value.push(marker);
        } catch (error) {
          console.error('Error processing feature:', error);
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
      }
    };

    onMounted(() => {
      // Initialize map with default coordinates
      map.value = L.map('map').setView([40.7128, -74.006], 12);

      // Initialize tile layer using our updateTileLayer function
      updateTileLayer();

      // Remove zoom control (optional)
      map.value.removeControl(map.value.zoomControl);

      // Load map data if we have it
      if (props.geojson) {
        updateMap(props.geojson);
      }
    });

    onUnmounted(() => {
      // Clean up map instance when component is unmounted
      if (map.value) {
        map.value.remove();
      }
    });

    return {
      map,
      markers,
      tileLayer,
      hasAutoFitted,
      updateTileLayer,
      updateMap,
    };
  },
};
</script>

<style>
/* Import leaflet css in your component */
@import 'leaflet/dist/leaflet.css';

/* Add custom styles for the map */
#map {
  height: 100%;
  width: 100%;
}

/* Ensure Leaflet tiles display correctly */
.leaflet-tile-pane {
  z-index: 0;
}

/* Keep markers below overlay components like legends */
.leaflet-marker-pane {
  z-index: 200; /* low value so markers stay under overlays */
}

.leaflet-control-container {
  z-index: 10;
}

/* Display popups above overlay components */
.leaflet-popup-pane {
  z-index: 1000; /* high value so popups show over legends */
}

/* Style for the water bottle icons */
.water-bottle-icon {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}

/* Style the popup to match the app design */
/* Dark mode popup styles will be applied via JS in updatePopupStyles */
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
.site-popup .text-green-500 {
  color: #22c55e;
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
