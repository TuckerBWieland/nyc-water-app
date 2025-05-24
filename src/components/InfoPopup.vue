<template>
  <div
    v-if="isOpen"
    :class="[
      'fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-40 max-w-md w-[90%] mx-auto transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black',
    ]"
  >
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">About This Map</h3>
      <button
        :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
        @click="isOpen = false"
      >
        &times;
      </button>
    </div>
    <div class="prose text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
      <p>
        This interactive map displays weekly water quality data collected by community scientists
        through the NYC Water Quality Monitoring program.
      </p>
      <br />
      <p>
        Each dot represents a sampling site across NYC's waterways, color-coded based on the
        presence of enterococcus bacteria—an indicator of water safety for recreational activities.
      </p>
      <p class="mt-2">
        <span class="text-green-500 font-medium">Green</span>: &lt; 35 MPN/100mL - Acceptable for
        swimming
      </p>
      <p class="mt-1">
        <span class="text-yellow-400 font-medium">Yellow</span>: 35-104 MPN/100mL - Unacceptable if
        levels persist
      </p>
      <p class="mt-1">
        <span class="text-red-500 font-medium">Red</span>: &gt; 104 MPN/100mL - Unacceptable for
        swimming
      </p>
      <p class="mt-4 font-semibold">What does MPN mean?</p>
      <p>
        MPN stands for Most Probable Number — it's a way of estimating the number of
        bacteria in a water sample. Higher MPN values suggest more contamination and a
        higher risk for swimmers. Levels above 104 MPN/100mL are typically considered
        unsafe for recreational water.
      </p>
    </div>
  </div>

  <button
    :class="[
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800',
    ]"
    title="Information"
    @click="togglePopup"
  >
    <span class="font-semibold text-lg">i</span>
  </button>
</template>

<script>
import { onMounted } from 'vue';
import { usePopupManager } from '../composables/usePopupManager';
import { track, EVENT_OPEN_POPUP } from '../services/analytics';

export default {
  name: 'InfoPopup',
  props: {
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { isOpen, togglePopup: baseToggle } = usePopupManager('info');

    const togglePopup = (trackEvent = true) => {
      const wasClosed = !isOpen.value;
      baseToggle();
      if (wasClosed && trackEvent) {
        track(EVENT_OPEN_POPUP, { component: 'InfoPopup' });
      }
    };

    onMounted(() => {
      try {
        if (!localStorage.getItem('hasSeenInfoPopup')) {
          togglePopup(false);
          localStorage.setItem('hasSeenInfoPopup', 'true');
        }
      } catch (e) {
        // localStorage might not be available
        console.error('Failed to access localStorage', e);
      }
    });

    return {
      isOpen,
      togglePopup,
    };
  },
};
</script>
