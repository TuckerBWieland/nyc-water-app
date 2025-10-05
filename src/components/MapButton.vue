<template>
  <button
    :class="[
      'rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300 pointer-events-auto touch-action-manipulation',
      isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
    ]"
    :style="{ pointerEvents: 'auto', touchAction: 'manipulation' }"
    aria-label="Map"
    @click="goToMap"
    @touchstart.stop.prevent="goToMap"
  >
    <span class="font-semibold text-lg pointer-events-none">🗺️</span>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import latestDate from '../generated/latest-date';

interface Props {
  isDarkMode?: boolean;
}

withDefaults(defineProps<Props>(), {
  isDarkMode: false,
});

const router = useRouter();

/**
 * Navigate to the latest map view.
 */
const goToMap = (): void => {
  router.push(`/${latestDate}`);
};
</script>
