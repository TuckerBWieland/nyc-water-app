<template>
  <div class="w-full h-full">
    <div id="map" class="absolute inset-0"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import {
  createWaterBottleIcon,
  updateTileLayer,
  updateMap,
  updatePopupStyles,
} from '../composables/useMapViewer';

export default {
  name: 'MapViewer',
  props: {
    selectedDate: { type: String, required: true },
    isDarkMode: { type: Boolean, default: false },
    geojson: { type: Object, default: null },
  },
  setup(props) {
    const map = ref(null);
    const markers = ref([]);
    const tileLayer = ref(null);
    const hasAutoFitted = ref(false);

    const applyTileLayer = () =>
      updateTileLayer({ map, tileLayer, markers, isDarkMode: props.isDarkMode });

    const applyMapData = data =>
      updateMap({ map, markers, hasAutoFitted, isDarkMode: props.isDarkMode, data });

    watch(
      () => props.isDarkMode,
      () => applyTileLayer(),
    );

    watch(
      () => props.geojson,
      newData => {
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

    return { map, markers, tileLayer, updatePopupStyles };
  },
};
</script>
