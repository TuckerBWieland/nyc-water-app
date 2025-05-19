<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import MapViewer from '../components/MapViewer.vue';
import RainDropLegend from '../components/RainDropLegend.vue';
import SampleBarLegend from '../components/SampleBarLegend.vue';
import DateScroller from '../components/DateScroller.vue';
import InfoPopup from '../components/InfoPopup.vue';
import { useStaticData } from '../composables/useStaticData';

const route = useRoute();
const date = ref(route.params.date);
const isDarkMode = ref(false);
const availableDates = ref(['2025-05-14', '2025-05-08']);

// Use the static data composable
// Pass the date ref so the composable can react to updates
const { data, metadata, loading, error, load } = useStaticData(date);

onMounted(async () => {
  // Load data for the current date
  await load();
  console.log('Data loaded:', data.value);
});

// Watch for route parameter changes
watch(() => route.params.date, (newDate) => {
  if (newDate && newDate !== date.value) {
    console.log('Route date changed:', newDate);
    date.value = newDate;
    load(newDate);
  }
});

// Watch for date changes to reload data
watch(date, (newDate) => {
  console.log('Date changed:', newDate);
  if (newDate) {
    load(newDate);
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
      <DateScroller 
        :dates="availableDates" 
        v-model="date"
        :isDarkMode="isDarkMode"
      />
      
      <!-- Legends -->
      <div class="absolute top-2 left-2 z-10 space-y-2">
        <SampleBarLegend 
          :samples="data.features" 
          :isDarkMode="isDarkMode" 
        />
        <RainDropLegend 
          :selectedDate="date"
          :isDarkMode="isDarkMode"
          :rainfallData="data.features[0]?.properties.rainByDay || []"
        />
      </div>
      
      <!-- Main map -->
      <MapViewer 
        :selectedDate="date" 
        :isDarkMode="isDarkMode"
        :geojson="data"
      />
      
      <!-- Info popup -->
      <InfoPopup :isDarkMode="isDarkMode" />
    </div>
    
    <div v-else class="text-center h-screen flex items-center justify-center flex-col">
      <div v-if="loading" class="text-lg">
        Loading water quality data...
      </div>
      <div v-else-if="error" class="text-red-500">
        <p class="text-lg">Error: {{ error }}</p>
        <p class="mt-2">Could not load data for {{ date }}</p>
      </div>
      <div v-else class="text-lg">
        No data available
      </div>
    </div>
  </div>
</template>
