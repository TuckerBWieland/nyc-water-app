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
      <p class="font-semibold mb-2 bg-orange-700">Why heavy rain leads to poor water quality samples:</p>
      <p>
        When it rains heavily, New York City's sewer system—which combines sewage and stormwater in the same
        pipes—can become overwhelmed. To prevent backups into homes and streets, this excess mixture is
        discharged directly into waterways like Newtown Creek and the East River through Combined Sewer
        Overflows (CSOs). These overflows carry untreated sewage, bacteria, and other pollutants into the water,
        significantly reducing water quality. That's why samples collected after major rain events often show
        poor results.
      </p>
      <p class="mt-2 font-semibold mb-2 bg-orange-700">Where our rainfall and tide data come from:</p>
      <p>
        Rainfall data is sourced from NOAA’s National Weather Service, specifically from the Central Park
        weather station. This provides a consistent benchmark for citywide precipitation.
      </p>
      <p>
        Tide data comes from NOAA’s tide predictions, using the Battery (NY) tidal station as a reference.
        Tidal stage helps us understand how water is moving through the estuary, which affects how pollutants
        disperse.
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
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 ml-[-3rem] z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300',
      showNotification ? 'bg-orange-700 text-white' : isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800',
    ]"
    title="Data information"
    @click="togglePopup"
  >
    <span class="font-semibold text-lg">?</span>
  </button>
</template>

<script>
import { toRef } from 'vue';
import { usePopupManager } from '../composables/usePopupManager';
import {
  track,
  EVENT_CLICK_DATA_INFO_BUTTON,
  EVENT_CLICK_OUTBOUND_LINK,
  EVENT_OPEN_POPUP,
} from '../services/analytics';

export default {
  name: 'DataInfoPopup',
  props: {
    isDarkMode: {
      type: Boolean,
      default: false,
    },
    showNotification: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { isOpen, togglePopup: baseToggle } = usePopupManager('data-info');

    const togglePopup = () => {
      const wasClosed = !isOpen.value;
      baseToggle();
      if (wasClosed) {
        track(EVENT_OPEN_POPUP, { component: 'DataInfoPopup' });
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
      showNotification: toRef(props, 'showNotification'),
    };
  },
};
</script>
