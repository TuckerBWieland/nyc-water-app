<template>
  <div
    class="sample-bar-legend p-2 rounded shadow-md"
    :class="isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'"
  >
    <h3 class="text-xs font-medium mb-1">Sample Quality</h3>

    <!-- Sample Bar -->
    <div class="w-full h-4 rounded-full overflow-hidden flex">
      <!-- Green section -->
      <div
        v-if="greenCount > 0"
        class="h-full bg-green-500 transition-all duration-500 ease-out"
        :style="{ width: `${greenPercentage}%` }"
        :title="`${greenCount} Good samples`"
      ></div>

      <!-- Yellow section -->
      <div
        v-if="yellowCount > 0"
        class="h-full bg-yellow-400 transition-all duration-500 ease-out"
        :style="{ width: `${yellowPercentage}%` }"
        :title="`${yellowCount} Moderate samples`"
      ></div>

      <!-- Red section -->
      <div
        v-if="redCount > 0"
        class="h-full bg-red-500 transition-all duration-500 ease-out"
        :style="{ width: `${redPercentage}%` }"
        :title="`${redCount} Poor samples`"
      ></div>
    </div>

    <!-- Sample counts -->
    <div class="flex justify-between text-xs mt-1">
      <div class="flex items-center">
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        <span>{{ greenCount }}</span>
      </div>
      <div class="flex items-center">
        <span class="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
        <span>{{ yellowCount }}</span>
      </div>
      <div class="flex items-center">
        <span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
        <span>{{ redCount }}</span>
      </div>
    </div>

    <!-- Total sites sampled display -->
    <div
      class="text-xs text-center mt-2 pt-2 border-t"
      :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
    >
      <span class="font-semibold">Total sites:</span>
      <span class="font-bold">{{ totalCount }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'SampleBarLegend',
  props: {
    samples: {
      type: Array,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    // Compute counts for each category
    const greenCount = computed(() => {
      return props.samples.filter(sample => Number(sample.properties.mpn) < 35).length;
    });

    const yellowCount = computed(() => {
      return props.samples.filter(sample => {
        const mpn = Number(sample.properties.mpn);
        return mpn >= 35 && mpn <= 104;
      }).length;
    });

    const redCount = computed(() => {
      return props.samples.filter(sample => Number(sample.properties.mpn) > 104).length;
    });

    const totalCount = computed(() => {
      return props.samples.length;
    });

    // Compute percentages for width
    const greenPercentage = computed(() => {
      return totalCount.value > 0 ? (greenCount.value / totalCount.value) * 100 : 0;
    });

    const yellowPercentage = computed(() => {
      return totalCount.value > 0 ? (yellowCount.value / totalCount.value) * 100 : 0;
    });

    const redPercentage = computed(() => {
      return totalCount.value > 0 ? (redCount.value / totalCount.value) * 100 : 0;
    });

    return {
      greenCount,
      yellowCount,
      redCount,
      totalCount,
      greenPercentage,
      yellowPercentage,
      redPercentage,
    };
  },
};
</script>

<style scoped>
.sample-bar-legend {
  min-width: 140px;
}
</style>
