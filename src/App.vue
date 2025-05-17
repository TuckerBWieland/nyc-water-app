<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <MapViewer
      :selected-date="selectedDate"
      :is-dark-mode="isDarkMode"
      @update:site-count="updateSiteCount"
      @update:sample-data="updateSampleData"
      @update:rainfall-by-day-in="updateRainfallByDayIn"
      @update:rain-data="updateRainData"
      @update:total-rain="updateTotalRain"
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
      <RainDropLegend
        :rainfall="rainfall"
        :rainfall-by-day-in="rainfallByDayIn"
        :rain-data="rainData"
        :total-rain="totalRain"
        :is-dark-mode="isDarkMode"
      />
    </div>

    <!-- Bottom navigation elements stacked in proper order -->
    <DateScroller v-model="selectedDate" :dates="dates" :is-dark-mode="isDarkMode" />
    <InfoPopup :is-dark-mode="isDarkMode" />
  </div>
</template>

<!--
/**
 * @component App
 * @description Root application component that orchestrates the NYC Water App
 * It manages the global state and coordinates interactions between child components.
 * 
 * This component is responsible for:
 * - Loading and managing available dates
 * - Tracking the selected date
 * - Managing dark/light mode theme
 * - Coordinating component interactions
 * 
 * @displayName App
 */
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MapViewer from './components/MapViewer.vue';
import HeaderOverlay from './components/HeaderOverlay.vue';
import DateScroller from './components/DateScroller.vue';
import InfoPopup from './components/InfoPopup.vue';
import SampleBarLegend from './components/SampleBarLegend.vue';
import RainDropLegend from './components/RainDropLegend.vue';
import { handleAsyncOperation, ErrorSeverity } from './utils/errorHandler';

/**
 * Available data dates from the API
 * @type {import('vue').Ref<string[]>}
 */
const dates = ref<string[]>([]);

/**
 * Currently selected date for data display
 * @type {import('vue').Ref<string>}
 */
const selectedDate = ref<string>('');

/**
 * Count of water sampling sites for current date
 * @type {import('vue').Ref<number>}
 */
const siteCount = ref<number>(0);

/**
 * Whether the app is in dark mode
 * @type {import('vue').Ref<boolean>}
 */
const isDarkMode = ref<boolean>(true); // Default to dark mode

/**
 * Whether the header overlay is expanded
 * @type {import('vue').Ref<boolean>}
 */
const isHeaderExpanded = ref<boolean>(false);

/**
 * Sample data for the legends
 * @type {import('vue').Ref<Array<{ site: string, mpn: string | number }>>}
 */
const sampleData = ref<Array<{ site: string; mpn: string | number }>>([]);

/**
 * Rainfall amount in inches (for the rain drop legend)
 * @type {import('vue').Ref<number>}
 */
const rainfall = ref<number>(1.25);

/**
 * Rainfall by day in inches (for the rain drop legend) - legacy format
 * @type {import('vue').Ref<Array<number | null>>}
 */
const rainfallByDayIn = ref<Array<number | null>>([]);

/**
 * New rainfall data array in inches (for the rain drop legend)
 * @type {import('vue').Ref<Array<number>>}
 */
const rainData = ref<Array<number>>([]);

/**
 * Total rainfall in inches over the 7-day period
 * @type {import('vue').Ref<number>}
 */
const totalRain = ref<number>(0);

/**
 * Update the count of water sampling sites
 * Called by MapViewer when new data is loaded
 *
 * @param {number} count - Number of sampling sites
 */
const updateSiteCount = (count: number): void => {
  siteCount.value = count;
};

/**
 * Update the sample data for the legend
 * Called by MapViewer when new data is loaded
 *
 * @param {Array<{ site: string, mpn: string | number }>} data - Sample data for legend
 */
const updateSampleData = (data: Array<{ site: string; mpn: string | number }>): void => {
  sampleData.value = data;
};

/**
 * Toggle between dark and light mode
 */
const toggleDarkMode = (): void => {
  isDarkMode.value = !isDarkMode.value;
};

/**
 * Update the map mode based on header control
 *
 * @param {boolean} darkMode - Whether dark mode is enabled
 */
const updateMapMode = (darkMode: boolean): void => {
  isDarkMode.value = darkMode;
};

/**
 * Update the rainfall by day data - legacy format
 * Called by MapViewer when new data is loaded
 *
 * @param {Array<number | null>} data - Rainfall by day data in inches
 */
const updateRainfallByDayIn = (data: Array<number | null>): void => {
  rainfallByDayIn.value = data;

  // Also update the total rainfall value (for backward compatibility)
  const total = data.reduce((sum, val) => sum + (val || 0), 0);
  rainfall.value = Number(total.toFixed(1));
};

/**
 * Update the new rainfall data array
 * Called by MapViewer when new data is loaded
 *
 * @param {Array<number>} data - Rainfall data array in inches
 */
const updateRainData = (data: Array<number>): void => {
  rainData.value = data;
};

/**
 * Update the total rainfall value
 * Called by MapViewer when new data is loaded
 *
 * @param {number} value - Total rainfall in inches
 */
const updateTotalRain = (value: number): void => {
  totalRain.value = value;
};

/**
 * Initialize the component on mount
 * Fetches available dates and sets the default date
 */
onMounted(async (): Promise<void> => {
  await handleAsyncOperation(
    async () => {
      const url = `${import.meta.env.BASE_URL}data/index.json`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to load dates index: ${res.status} ${res.statusText}`);
      }

      const index = await res.json();

      if (!index || !Array.isArray(index.dates) || typeof index.latest !== 'string') {
        throw new Error('Invalid index data format');
      }

      dates.value = index.dates;
      selectedDate.value = index.latest;
    },
    { component: 'App', operation: 'loadDates' },
    {
      logToConsole: true,
      reportToAnalytics: true,
      showToUser: true,
      fallbackValue: undefined,
    }
  );
});
</script>
