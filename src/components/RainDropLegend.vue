<template>
  <div
    class="rain-drop-legend p-2 rounded shadow-md"
    :class="isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'"
  >
    <h3 class="text-xs font-medium mb-1">7-Day Rainfall</h3>

    <div class="flex items-center">
      <!-- Water drop SVG with animated fill -->
      <div class="relative w-8 h-12 mr-2">
        <svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <!-- Droplet outline -->
          <path
            d="M50,0 C50,0 0,70 0,110 C0,138.1 22.4,160 50,160 C77.6,160 100,138.1 100,110 C100,70 50,0 50,0 Z"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            :class="isDarkMode ? 'text-sky-600' : 'text-sky-700'"
          />

          <!-- Droplet fill - uses clipPath to animate fill level -->
          <path
            d="M50,0 C50,0 0,70 0,110 C0,138.1 22.4,160 50,160 C77.6,160 100,138.1 100,110 C100,70 50,0 50,0 Z"
            class="text-sky-400"
            fill="currentColor"
            :clip-path="'url(#rainClip' + _uid + ')'"
          />

          <!-- Clip path for water level -->
          <clipPath :id="'rainClip' + _uid">
            <rect x="0" :y="160 - fillHeight" width="100" :height="fillHeight" />
          </clipPath>
        </svg>
      </div>

      <!-- Rainfall text -->
      <div class="flex flex-col items-center">
        <div class="flex items-baseline gap-1 text-lg font-bold">
          <span>{{ rainfall.toFixed(2) }}</span
          ><span class="text-xs">in</span>
        </div>
        <span class="text-xs text-gray-500 mt-1">{{ getRainfallLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  rainfall: {
    type: Number,
    default: 0,
  },
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

const _uid = ref(`rain-${Math.random().toString(36).substring(2, 9)}`);

// Clip fill height: max 160px for 15 inches
const fillHeight = computed(() => {
  const percentage = Math.min(props.rainfall / 15, 1);
  return percentage * 160;
});

const getRainfallLabel = computed(() => {
  if (props.rainfall < 0.1) return 'Dry';
  if (props.rainfall < 1) return 'Light';
  if (props.rainfall < 3) return 'Moderate';
  if (props.rainfall < 6) return 'Heavy';
  if (props.rainfall < 10) return 'Very Heavy';
  return 'Extreme';
});
</script>

<style scoped>
.rain-drop-legend {
  min-width: 90px;
}
</style>
