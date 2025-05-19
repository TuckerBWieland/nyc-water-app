<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <MapViewer
      :selected-date="selectedDate"
      :is-dark-mode="isDarkMode"
      @update:site-count="updateSiteCount"
      @update:sample-data="updateSampleData"
      @update:rain-data="updateRainData"
    />
    <HeaderOverlay
      v-model:is-expanded="isHeaderExpanded"
      :latest-date="selectedDate"
      :site-count="siteCount"
      :is-dark-mode="isDarkMode"
      @toggle-map-mode="updateMapMode"
    />

    <!-- Dark/Light Mode Toggle Button - lower z-index (20) when header is expanded -->
    <div
      class="absolute right-2 sm:right-4 top-4 transition-opacity duration-300"
      :class="[isHeaderExpanded ? 'z-20 opacity-0' : 'z-40 opacity-100']"
    >
      <button
        :class="[
          'rounded-full p-2 shadow-md focus:outline-none transition-colors duration-300',
          isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : 'bg-white text-gray-800 hover:bg-gray-100',
        ]"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        aria-label="Toggle dark mode"
        @click="toggleDarkMode"
      >
        <span class="text-lg">{{ isDarkMode ? '🌞' : '🌙' }}</span>
      </button>
    </div>

    <!-- Legend components in top-left corner - only visible when header is collapsed -->
    <div v-if="!isHeaderExpanded" class="absolute top-4 left-4 z-40 flex flex-col space-y-2">
      <SampleBarLegend :samples="sampleData" :is-dark-mode="isDarkMode" />
      <RainDropLegend :selected-date="selectedDate" :is-dark-mode="isDarkMode" :rainfall-data="rainData" />
    </div>

    <!-- Bottom navigation elements stacked in proper order -->
    <DateScroller v-model="selectedDate" :dates="dates" :is-dark-mode="isDarkMode" />
    <InfoPopup :is-dark-mode="isDarkMode" />
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import MapViewer from './components/MapViewer.vue';
import HeaderOverlay from './components/HeaderOverlay.vue';
import DateScroller from './components/DateScroller.vue';
import InfoPopup from './components/InfoPopup.vue';
import SampleBarLegend from './components/SampleBarLegend.vue';
import RainDropLegend from './components/RainDropLegend.vue';
import { useStaticData } from './composables/useStaticData.js';

export default {
  name: 'App',
  components: {
    MapViewer,
    HeaderOverlay,
    DateScroller,
    InfoPopup,
    SampleBarLegend,
    RainDropLegend,
  },
  setup() {
    /**
     * Use the static data composable to access pre-compiled data
     */
    const { selectedDate, availableDates, currentData, isLoading } = useStaticData();

    /**
     * Count of water sampling sites for current date
     */
    const siteCount = ref(0);

    /**
     * Whether the app is in dark mode
     */
    const isDarkMode = ref(true); // Default to dark mode

    /**
     * Whether the header overlay is expanded
     */
    const isHeaderExpanded = ref(false);

    /**
     * Sample data for the legends
     */
    const sampleData = ref([]);
    
    /**
     * Rainfall data for the RainDropLegend
     */
    const rainData = ref([]);

    /**
     * Update the count of water sampling sites
     * Called by MapViewer when new data is loaded
     *
     * @param {number} count - Number of sampling sites
     */
    const updateSiteCount = count => {
      siteCount.value = count;
    };

    /**
     * Update the sample data for the legend
     * Called by MapViewer when new data is loaded
     *
     * @param {Array} data - Sample data for legend
     */
    const updateSampleData = data => {
      sampleData.value = data;
    };
    
    /**
     * Update the rainfall data
     * Called by MapViewer when new data is loaded
     * 
     * @param {Array} data - Rainfall data array
     */
    const updateRainData = data => {
      rainData.value = data;
    };

    /**
     * Toggle between dark and light mode
     */
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
    };

    /**
     * Update the map mode based on header control
     *
     * @param {boolean} darkMode - Whether dark mode is enabled
     */
    const updateMapMode = darkMode => {
      isDarkMode.value = darkMode;
    };

    // Watch currentData and update derived values when it changes
    watch(currentData, (newData) => {
      if (newData && newData.features) {
        // Update site count
        siteCount.value = newData.features.length;
        
        // Extract the sample data for the legend
        const samples = newData.features.map(feature => ({
          site: feature.properties.site || feature.properties['Site Name'] || '',
          mpn: feature.properties.mpn || feature.properties['MPN'] || '',
        }));
        sampleData.value = samples;
        
        // Extract rainfall data if available
        if (newData.features.some(f => f.properties.rainfall_mm_7day !== undefined)) {
          // Create a synthetic 7-day distribution from the average rainfall_mm_7day
          // Calculate average 7-day rainfall across all points and convert from mm to inches
          const totalRainfall = newData.features.reduce((sum, feature) => {
            return sum + (feature.properties.rainfall_mm_7day || 0);
          }, 0);
          const averageRainfall = totalRainfall / newData.features.length;

          // Convert mm to inches (1 mm = 0.0393701 inches)
          const totalRainfallInches = averageRainfall * 0.0393701;

          // Create a distribution over 7 days - this is synthetic data
          const distribution = [0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05];
          const rainfallByDay = distribution.map(factor =>
            Number((totalRainfallInches * factor).toFixed(2))
          );

          // Update rainfall data
          rainData.value = rainfallByDay;
        }
      }
    }, { immediate: true });

    return {
      dates: availableDates,
      selectedDate,
      siteCount,
      isDarkMode,
      isHeaderExpanded,
      sampleData,
      rainData,
      updateSiteCount,
      updateSampleData,
      updateRainData,
      toggleDarkMode,
      updateMapMode,
    };
  },
};
</script>
