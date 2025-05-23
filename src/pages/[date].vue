<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MapViewer from '../components/MapViewer.vue';
import RainDropLegend from '../components/RainDropLegend.vue';
import SampleBarLegend from '../components/SampleBarLegend.vue';
import DateScroller from '../components/DateScroller.vue';
import InfoPopup from '../components/InfoPopup.vue';
import DataInfoPopup from '../components/DataInfoPopup.vue';
import DonatePopup from '../components/DonatePopup.vue';
import { useStaticData } from '../composables/useStaticData';

const route = useRoute();
const router = useRouter();
const date = ref(route.params.date);
const isDarkMode = ref(true);

// Apply initial theme class to document
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  document.body.classList.toggle('dark', isDarkMode.value);
}
// List of available data dates will be loaded from dates.json
const availableDates = ref([]);

// Use the static data composable
// Pass the date ref so the composable can react to updates
const { data, metadata, loading, error, load } = useStaticData(date);

// Calculate the percentage of samples testing poor for the week
const poorPercentage = computed(() => {
  if (!data.value || !Array.isArray(data.value.features)) return 0;
  const total = data.value.features.length;
  if (total === 0) return 0;
  const poorCount = data.value.features.filter(
    feature => Number(feature.properties.mpn) > 104
  ).length;
  return (poorCount / total) * 100;
});

const showDataInfoNotification = computed(() => poorPercentage.value > 50);

onMounted(async () => {
  // Load list of available dates
  try {
    const base = import.meta.env.MODE === 'production' ? '/nyc-water-app' : '';
    const res = await fetch(`${base}/data/dates.json`);
    if (res.ok) {
      const dates = await res.json();
      availableDates.value = Array.isArray(dates) ? dates.sort() : [];
    } else {
      console.warn('Failed to fetch dates.json:', res.status);
    }
  } catch (err) {
    console.warn('Error fetching dates.json:', err);
  }

  // Load data for the current date
  await load();
  console.log('Data loaded:', data.value);
});

// Watch for route parameter changes
watch(
  () => route.params.date,
  newDate => {
    if (newDate && newDate !== date.value) {
      console.log('Route date changed:', newDate);
      date.value = newDate;
      load(newDate);
    }
  }
);

// Watch for date changes to reload data
watch(date, newDate => {
  console.log('Date changed:', newDate);
  if (newDate) {
    load(newDate);
    router.push({ path: `/${newDate}` });
  }
});

// Watch for dark mode changes to update body class
watch(isDarkMode, val => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', val);
    document.body.classList.toggle('dark', val);
  }
});

// Toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};
</script>

<template>
  <div>
    <!-- Theme toggle button -->
    <button
      @click="toggleDarkMode"
      class="fixed top-4 right-4 z-50 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-300"
      :class="isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>

    <div v-if="data && metadata">
      <DateScroller :dates="availableDates" v-model="date" :isDarkMode="isDarkMode" />

      <!-- Legends -->
      <div class="absolute top-2 left-2 z-10 space-y-2">
        <SampleBarLegend :samples="data.features" :isDarkMode="isDarkMode" />
        <RainDropLegend
          :selectedDate="date"
          :isDarkMode="isDarkMode"
          :rainfallData="data.features[0]?.properties.rainByDay || []"
        />
      </div>

      <!-- Main map -->
      <MapViewer :selectedDate="date" :isDarkMode="isDarkMode" :geojson="data" />

      <!-- Info and action popups -->
      <InfoPopup :isDarkMode="isDarkMode" />
      <DataInfoPopup
        :isDarkMode="isDarkMode"
        :showNotification="showDataInfoNotification"
      />
      <DonatePopup :isDarkMode="isDarkMode" />
    </div>

    <div v-else class="text-center h-screen flex items-center justify-center flex-col">
      <div v-if="loading" class="text-lg">Loading water quality data...</div>
      <div v-else-if="error" class="text-red-500">
        <p class="text-lg">Error: {{ error }}</p>
        <p class="mt-2">Could not load data for {{ date }}</p>
      </div>
      <div v-else class="text-lg">No data available</div>
    </div>
  </div>
</template>
