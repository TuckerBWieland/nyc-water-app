<template>
  <div
    v-if="isOpen"
    :class="[
      'fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-40 max-w-md w-[90%] mx-auto transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black',
    ]"
  >
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">About the Data</h3>
      <button
        :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
        @click="isOpen = false"
      >
        &times;
      </button>
    </div>
    <div class="prose text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
      <p>
        Weekly water samples are collected by community scientists at sites across NYC. Enterococcus
        bacteria levels are measured alongside local conditions like rainfall and tides.
      </p>
      <p class="mt-2">
        View the detailed dataset
        <a
          href="https://docs.google.com/spreadsheets/d/12wNiul0QSymg3gO9OdwKkvAms-iHkz2i0hyxl6AP8eQ/edit?gid=0#gid=0"
          target="_blank"
          rel="noopener"
          @click="
            trackOutbound(
              'https://docs.google.com/spreadsheets/d/12wNiul0QSymg3gO9OdwKkvAms-iHkz2i0hyxl6AP8eQ/edit?gid=0#gid=0'
            )
          "
          >here</a
        >.
      </p>
    </div>
  </div>

  <button
    :class="[
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(50%-4rem)] z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800',
    ]"
    title="Data information"
    @click="togglePopup"
  >
    <span class="font-semibold text-lg">?</span>
  </button>
</template>

<script>
import { usePopupManager } from '../composables/usePopupManager';
import {
  track,
  EVENT_CLICK_DATA_INFO_BUTTON,
  EVENT_CLICK_OUTBOUND_LINK,
} from '../services/analytics';

export default {
  name: 'DataInfoPopup',
  props: {
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const { isOpen, togglePopup: baseToggle } = usePopupManager('data-info');

    const togglePopup = () => {
      const wasClosed = !isOpen.value;
      baseToggle();
      if (wasClosed) {
        track(EVENT_CLICK_DATA_INFO_BUTTON);
      }
    };

    const trackOutbound = url => {
      track(EVENT_CLICK_OUTBOUND_LINK, { url });
    };

    return {
      isOpen,
      togglePopup,
      trackOutbound,
    };
  },
};
</script>
