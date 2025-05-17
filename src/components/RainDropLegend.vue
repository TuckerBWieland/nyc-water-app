<template>
  <div
    v-if="hasValidRainfallData"
    class="rain-drop-legend p-3 rounded shadow-md"
    :class="isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'"
  >
    <h3 class="text-xs font-medium mb-2">7-Day Rainfall</h3>

    <div class="flex items-end justify-between h-16 mb-1">
      <!-- 7 vertical bars representing daily rainfall -->
      <div v-for="(value, index) in rainData" :key="index" class="flex flex-col items-center group">
        <div
          class="w-3 rounded-t transition-all duration-300 shadow-sm hover:shadow-md group-hover:w-4"
          :class="getBarColorClass(value)"
          :style="{ height: `${getBarHeight(value)}%` }"
          :title="`${
            value !== null && value !== undefined ? Number(value).toFixed(2) : 'No data'
          } inches`"
        ></div>
        <span class="text-xs mt-1 font-medium">{{ getDayLabel(index) }}</span>
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

<script setup lang="ts">
import { computed, type PropType } from 'vue';

// Days of the week labels (Friday to Thursday, ending with sample day)
const dayLabels = ['F', 'S', 'S', 'M', 'T', 'W', 'Th'];

// Using Runtime props validation with proper TypeScript typing
const props = defineProps({
  rainfall: {
    type: Number,
    default: 0,
  },
  rainfallByDay: {
    type: Array as PropType<(number | null)[]>,
    default: () => [],
  },
  rainfallByDayIn: {
    type: Array as PropType<(number | null)[]>,
    default: () => [],
  },
  rainData: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
  totalRain: {
    type: Number,
    default: 0,
  },
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

// Check if we have array data available
const hasArrayData = computed<boolean>(() => {
  return props.rainfallByDayIn.length > 0 || props.rainfallByDay.length > 0;
});

// Generate a synthetic 7-day array from the single rainfall value
const syntheticRainData = computed<(number | null)[]>(() => {
  // Create an array with the rainfall value distributed over 7 days
  // This is a fallback for when only the single rainfall value is provided
  if (props.rainfall > 0) {
    // Create a distribution that looks natural - higher in middle days
    const distribution = [0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05];
    return distribution.map(factor => props.rainfall * factor);
  }
  return [0, 0, 0, 0, 0, 0, 0];
});

// Choose which rainfall data array to use
const rainData = computed<(number | null)[]>(() => {
  // Log what we have for debugging
  console.log('RainDropLegend props:', {
    rainData: props.rainData,
    rainfallByDayIn: props.rainfallByDayIn,
    rainfallByDay: props.rainfallByDay,
    totalRain: props.totalRain,
  });

  // Use the new rainData prop if provided
  if (props.rainData && props.rainData.length > 0) {
    console.log('Using rainData prop:', props.rainData);
    return props.rainData;
  }
  // Fallback to legacy props
  if (props.rainfallByDayIn && props.rainfallByDayIn.length > 0) {
    console.log('Using rainfallByDayIn prop:', props.rainfallByDayIn);
    return props.rainfallByDayIn;
  }
  if (props.rainfallByDay && props.rainfallByDay.length > 0) {
    console.log('Using rainfallByDay prop:', props.rainfallByDay);
    return props.rainfallByDay;
  }

  // Final fallback to synthetic data
  console.log('Using synthetic rain data:', syntheticRainData.value);
  return syntheticRainData.value;
});

// Calculate total rainfall (sum of all values)
const totalRainfall = computed<number>(() => {
  // Use totalRain prop if provided
  if (props.totalRain > 0) return props.totalRain;
  // Fallback to calculating from array data
  if (hasArrayData.value) {
    return rainData.value.reduce(
      (sum, val) => sum + (val !== null && val !== undefined ? Number(val) : 0),
      0
    );
  }
  // Use the single rainfall value if no array data available
  return props.rainfall;
});

// Formatted total rainfall with one decimal place
const totalRainfallValue = computed<string>(() => {
  return totalRainfall.value.toFixed(1);
});

// Check if we have valid rainfall data to display
const hasValidRainfallData = computed<boolean>(() => {
  // Use new props first
  if (props.rainData && props.rainData.length > 0) {
    // Check if rainData has at least one non-null, non-zero value
    const hasValidRainData = props.rainData.some(
      val => val !== null && val !== undefined && val > 0
    );
    console.log('hasValidRainData from props.rainData:', hasValidRainData);
    if (hasValidRainData) return true;
  }

  // Fallback to legacy props
  if (props.rainfall > 0) {
    console.log('Using props.rainfall > 0:', props.rainfall);
    return true;
  }

  // Check for total rain
  if (props.totalRain > 0) {
    console.log('Using props.totalRain > 0:', props.totalRain);
    return true;
  }

  // Check for array data
  if (!rainData.value || rainData.value.length === 0) {
    console.log('No rainData.value:', rainData.value);
    return false;
  }

  // Check if at least one value is not null and greater than zero
  const result = rainData.value.some(val => val !== null && val !== undefined && val > 0);
  console.log('Final check on rainData.value:', result, rainData.value);
  return result;
});

// Determine color class based on rainfall amount
const getBarColorClass = (value: number | null): string => {
  if (value === null || value === undefined) return 'bg-gray-200';

  if (value < 0.5) return props.isDarkMode ? 'bg-green-600' : 'bg-green-500';
  if (value < 3.0) return props.isDarkMode ? 'bg-yellow-500' : 'bg-yellow-400';
  return props.isDarkMode ? 'bg-red-600' : 'bg-red-500';
};

// Get day label for each bar
const getDayLabel = (index: number): string => {
  return dayLabels[index % 7];
};

// Calculate bar height percentage based on rainfall amount
const getBarHeight = (value: number | null): number => {
  if (value === null || value === undefined || value === 0) return 5; // Minimum height

  // Height is proportional to rainfall, max height at 4 inches
  // Use a logarithmic scale to better show differences in small values
  const heightPercentage = Math.max(5, Math.min(100, 20 * Math.log2(1 + Number(value) * 2)));
  return heightPercentage;
};
</script>

<style scoped>
.rain-drop-legend {
  min-width: 160px;
}

/* Ensure minimum height for bars with very small values */
.w-3 {
  min-height: 1px;
}
</style>
