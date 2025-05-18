<template>
  <div
    v-if="hasValidRainfallData"
    class="rain-drop-legend p-3 rounded shadow-md"
    :class="isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'"
  >
    <h3 class="text-xs font-medium mb-2">7-Day Rainfall</h3>

    <div class="flex items-end justify-between h-28 mb-1">
      <!-- 7 vertical bars representing daily rainfall -->
      <div
        v-for="(value, index) in activeRainData"
        :key="index"
        class="flex flex-col items-center group"
      >
        <div class="flex flex-col items-center">
          <div 
            class="text-xs opacity-70 mb-1 font-medium"
            v-if="value > 0"
          >
            {{ value.toFixed(1) }}
          </div>
          <div
            class="w-4 md:w-5 rounded-t transition-all duration-300 shadow-md border border-black/10"
            :class="getBarColorClass(value)"
            :style="{ height: `${getBarHeight(value)}%` }"
            :title="`${
              value !== null && value !== undefined ? Number(value).toFixed(2) : 'No data'
            } inches`"
          ></div>
          <span class="text-xs mt-1 font-medium">{{ getDayLabel(index) }}</span>
        </div>
      </div>
    </div>

    <!-- Total rainfall display -->
    <div
      class="text-xs text-center mt-2 pt-2 border-t"
      :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
    >
      <span class="font-semibold">Total rainfall:</span>
      <span class="font-bold">{{ totalRainfallValue }}</span>
      <span>in</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

// Days of the week labels (Friday to Thursday, ending with sample day)
const dayLabels = ['F', 'S', 'S', 'M', 'T', 'W', 'Th'];

// Static rainfall data map by sampling date (in inches)
const rainfallBySampleDate = {
  '2025-05-08': [0.0, 0.95, 0.15, 0.74, 0.24, 0.02, 0.01],
  '2025-05-14': [0.69, 0.01, 0.0, 0.0, 0.16, 1.22, 0.0],
  // Add future sampling weeks here as needed
};

export default {
  name: 'RainDropLegend',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    // Compute the rainfall array for the selected date
    const activeRainData = computed(() => {
      return rainfallBySampleDate[props.selectedDate] ?? [];
    });

    // Compute the total rainfall from that array
    const totalRainfall = computed(() => {
      return activeRainData.value.reduce((sum, val) => sum + (val || 0), 0);
    });

    // Formatted total rainfall with two decimal places
    const totalRainfallValue = computed(() => totalRainfall.value.toFixed(2));

    // Check if we have valid rainfall data to display
    const hasValidRainfallData = computed(() => {
      return (
        activeRainData.value.length > 0 &&
        activeRainData.value.some(val => val !== null && val !== undefined && val > 0)
      );
    });

    // Determine color class based on rainfall amount
    const getBarColorClass = value => {
      if (value === null || value === undefined)
        return props.isDarkMode ? 'bg-gray-500' : 'bg-gray-300';

      if (value < 0.5) return props.isDarkMode ? 'bg-green-600' : 'bg-green-500';
      if (value < 3.0) return props.isDarkMode ? 'bg-yellow-500' : 'bg-yellow-400';
      return props.isDarkMode ? 'bg-red-600' : 'bg-red-500';
    };

    // Get day label for each bar
    const getDayLabel = index => {
      return dayLabels[index % 7];
    };

    // Calculate bar height percentage based on rainfall amount
    const getBarHeight = value => {
      if (value === null || value === undefined || value === 0) return 5; // Minimal height for zero rainfall
      
      // Use a more linear scale to better show differences between values
      // Scale ranges from 15% to 100% for values between 0.01 and 2.0 inches
      const maxRainfall = 2.0; // Max height at 2 inches of rain
      const minHeight = 15;
      const maxHeight = 100;
      
      const heightPercentage = Math.max(
        minHeight, 
        Math.min(maxHeight, minHeight + ((Number(value) / maxRainfall) * (maxHeight - minHeight)))
      );
      
      return heightPercentage;
    };

    return {
      activeRainData,
      totalRainfall,
      totalRainfallValue,
      hasValidRainfallData,
      getBarColorClass,
      getDayLabel,
      getBarHeight,
    };
  },
};
</script>

<style scoped>
.rain-drop-legend {
  min-width: 160px;
}

/* Ensure minimum height for bars with very small values */
.w-4,
.md\:w-5 {
  min-height: 2px;
}
</style>
