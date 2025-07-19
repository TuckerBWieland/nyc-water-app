<template>
  <div class="w-full h-full">
    <div id="map" class="absolute inset-0"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import type { WaterQualityGeoJSON } from '../types';
import {
  updateTileLayer,
  updateMap,
} from '../composables/useMapViewer';

interface Props {
  selectedDate: string;
  isDarkMode?: boolean;
  geojson?: WaterQualityGeoJSON | null;
}

const props = withDefaults(defineProps<Props>(), {
  isDarkMode: false,
  geojson: null,
});

const map = ref<L.Map | null>(null);
const markers = ref<L.Marker[]>([]);
const tileLayer = ref<L.TileLayer | null>(null);
const hasAutoFitted = ref(false);

const applyTileLayer = () =>
  updateTileLayer({ map, tileLayer, markers, isDarkMode: props.isDarkMode });

const applyMapData = (data: WaterQualityGeoJSON) =>
  updateMap({ map, markers, hasAutoFitted, isDarkMode: props.isDarkMode, data });

watch(
  () => props.isDarkMode,
  () => applyTileLayer(),
);

watch(
  () => props.geojson,
  (newData) => {
    if (newData && map.value) applyMapData(newData);
  },
  { immediate: true },
);

onMounted(() => {
  map.value = L.map('map').setView([40.7128, -74.006], 12);
  applyTileLayer();
  map.value.removeControl(map.value.zoomControl);
  if (props.geojson) applyMapData(props.geojson);
});

onUnmounted(() => {
  if (map.value) map.value.remove();
});
</script>
