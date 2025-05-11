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

// Fix Leaflet's icon paths for webpack/vite bundling
// This is needed because the asset paths are different in the bundled output
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png'
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png'
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// Props
const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:siteCount'])

// Reactive references
const mapData = ref(null)
const map = ref(null)
const markers = ref([])

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
      
      // Create marker and popup
      const marker = L.marker([coordinates[1], coordinates[0]])
        .bindPopup(`<strong>${site}</strong><br>Water Quality: ${mpn} MPN/100mL`)
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
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map.value)
  
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
</style>