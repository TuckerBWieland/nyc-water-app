<template>
  <button
    :class="[
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 ml-[6rem] z-[300] rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
    ]"
    :style="{ pointerEvents: 'auto', touchAction: 'manipulation' }"
    aria-label="Trends"
    @click="goToTrends"
    @touchstart.stop.prevent="goToTrends"
  >
    <span class="text-lg pointer-events-none">📊</span>
  </button>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'TrendsButton',
  props: {
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const router = useRouter();

    /**
     * Navigate to the trends page.
     */
    const goToTrends = () => {
      router.push('/trends');
    };

    return { goToTrends };
  },
};
</script>

<style scoped>
button {
  min-width: 4rem;
}
</style>

