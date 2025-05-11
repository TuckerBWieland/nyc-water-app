<template>
  <div class="w-full h-full">
    <!-- Map container -->
    <div id="map" class="absolute inset-0 z-0"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, defineEmits } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Function to get color based on MPN value
const getColorForMPN = (mpn) => {
  const mpnValue = Number(mpn);
  if (mpnValue < 35) return '#4CAF50'; // Green
  if (mpnValue <= 104) return '#FFC107'; // Yellow
  return '#F44336'; // Red
}

// Function to create a custom water bottle divIcon
const createWaterBottleIcon = (mpn) => {
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
    popupAnchor: [0, -34]
  });
}

// Props
const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:siteCount'])

// Reactive references
const mapData = ref(null)
const map = ref(null)
const markers = ref([])
const tileLayer = ref(null)

// Tile layer URLs
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Update the map tile layer based on the current mode
const updateTileLayer = () => {
  if (!map.value) return

  // Remove existing tile layer if it exists
  if (tileLayer.value) {
    map.value.removeLayer(tileLayer.value)
  }

  // Add the appropriate new tile layer based on mode
  const currentTileUrl = props.isDarkMode ? DARK_TILE_URL : LIGHT_TILE_URL
  tileLayer.value = L.tileLayer(currentTileUrl, {
    attribution: '',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map.value)

  // Update existing popups if any
  updatePopupStyles()
}

// Update popup styles based on dark mode
const updatePopupStyles = () => {
  if (!map.value) return

  // Re-apply popups to all markers with updated styling
  markers.value.forEach(marker => {
    const popup = marker.getPopup()
    if (popup) {
      // Get the current content
      const content = popup.getContent()
      // Close and unbind the current popup
      marker.closePopup().unbindPopup()
      // Bind a new popup with the same content but updated class
      marker.bindPopup(content, {
        className: props.isDarkMode ? 'dark-mode-popup' : ''
      })
    }
  })
}

// Watch for changes in dark mode setting
watch(() => props.isDarkMode, () => {
  updateTileLayer()
})

// Watch for changes in selected date
watch(() => props.selectedDate, async (newDate) => {
  if (newDate) {
    await loadMapData(newDate)
  }
}, { immediate: true })

// Watch for changes in map data and update map
watch(mapData, (newData) => {
  if (newData && map.value) {
    updateMap(newData)
  }
})

// Methods
const loadMapData = async (date) => {
  try {
    const response = await fetch(`/data/${date}.geojson`)
    mapData.value = await response.json()
    
    // Update parent component with the site count
    if (mapData.value && mapData.value.features) {
      emit('update:siteCount', mapData.value.features.length)
    }
  } catch (error) {
    console.error('Error loading map data:', error)
  }
}

const updateMap = (data) => {
  // Clear existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  // Add new markers
  if (data.features && data.features.length > 0) {
    data.features.forEach(feature => {
      const { coordinates } = feature.geometry
      const { site, mpn } = feature.properties
      
      // Create marker with custom water bottle icon based on water quality
      const bottleIcon = createWaterBottleIcon(mpn);
      const marker = L.marker([coordinates[1], coordinates[0]], { icon: bottleIcon })
        .bindPopup(`<strong>${site}</strong><br>Water Quality: ${mpn} MPN/100mL`, {
          className: props.isDarkMode ? 'dark-mode-popup' : ''
        })
        .addTo(map.value)

      markers.value.push(marker)
    })
    
    // Fit map to markers if we have any
    if (markers.value.length > 0) {
      const group = L.featureGroup(markers.value)
      map.value.fitBounds(group.getBounds(), { padding: [30, 30] })
    }
  }
}

onMounted(() => {
  // Initialize map
  map.value = L.map('map').setView([40.7128, -74.0060], 12)
  
  // Initialize tile layer using our updateTileLayer function
  updateTileLayer()
  
  // Remove zoom control
  map.value.removeControl(map.value.zoomControl)
  
  // Load map data if we have a selected date
  if (props.selectedDate) {
    loadMapData(props.selectedDate)
  }
})

onUnmounted(() => {
  // Clean up map instance when component is unmounted
  if (map.value) {
    map.value.remove()
  }
})
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
}

.leaflet-popup-content {
  margin: 10px 14px;
  font-family: inherit;
  line-height: 1.5;
}

/* Light mode styles (default) */
.leaflet-popup-content-wrapper {
  background-color: rgba(255, 255, 255, 0.95);
  color: #1f2937;
}

/* Dark mode styles (applied via JS) */
.dark-mode-popup .leaflet-popup-content-wrapper {
  background-color: rgb(31, 41, 55);
  color: rgb(209, 213, 219);
}

.dark-mode-popup .leaflet-popup-tip {
  background-color: rgb(31, 41, 55);
}

/* Hide or minimize any remaining attribution text */
.leaflet-control-attribution {
  display: none;
}
</style>