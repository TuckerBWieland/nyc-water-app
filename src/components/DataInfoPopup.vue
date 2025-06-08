<template>
  <div
    v-if="isOpen"
    ref="popupRef"
    @click.stop
    :class="[
      'z-[400] fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 p-4 sm:p-6 rounded-lg shadow-lg max-w-[95vw] sm:max-w-[800px] w-[95%] sm:w-[700px] lg:w-[800px] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-stable transition-colors duration-300',
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
      <p class="font-semibold mb-2">Why heavy rain leads to poor water quality samples:</p>
      <p>
        When it rains heavily, New York City's sewer system—which combines sewage and stormwater in the same
        pipes—can become overwhelmed. To prevent backups into homes and streets, this excess mixture is
        discharged directly into waterways like Newtown Creek and the East River through Combined Sewer
        Overflows (CSOs). These overflows carry untreated sewage, bacteria, and other pollutants into the water,
        significantly reducing water quality. That's why samples collected after major rain events often show
        poor results.
      </p>
      <p class="mt-2 font-semibold mb-2">Where our rainfall and tide data come from:</p>
      <p>
        Rainfall data is sourced from NOAA’s National Weather Service, specifically from the Central Park
        weather station. This provides a consistent benchmark for citywide precipitation.
      </p>
      <br>
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
    </div>
  </div>

  <button
    :class="[
      'rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300 pointer-events-auto touch-action-manipulation',
      showNotification ? 'bg-orange-700 text-white hover:bg-orange-800' : isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
    ]"
    :style="{ pointerEvents: 'auto', touchAction: 'manipulation' }"
    title="Data information"
    @click.stop="togglePopup"
    @touchstart.stop.prevent="togglePopup"
  >
    <span class="font-semibold text-lg pointer-events-none">?</span>
  </button>
</template>

<script>
import { toRef, ref, watch, onUnmounted } from 'vue';
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
  /**
   * Setup function for the DataInfoPopup component.
   * Initializes popup state management and event listeners.
   *
   * @param {Object} props - Component properties.
   * @returns {Object} Reactive bindings for the template.
   */
  setup(props) {
    const { isOpen, togglePopup: baseToggle, closePopup } = usePopupManager('data-info');
    const popupRef = ref(null);

    /**
     * Close the popup when clicking outside of it.
     *
     * @param {MouseEvent} e - Click event object.
     */
    const handleOutsideClick = e => {
      if (popupRef.value && !popupRef.value.contains(e.target)) {
        closePopup();
      }
    };

    watch(isOpen, open => {
      if (open) {
        document.addEventListener('click', handleOutsideClick);
      } else {
        document.removeEventListener('click', handleOutsideClick);
      }
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleOutsideClick);
    });

    /**
     * Toggle popup visibility and track analytics events.
     */
    const togglePopup = () => {
      try {
        const wasClosed = !isOpen.value;
        baseToggle();
        if (wasClosed) {
          track(EVENT_OPEN_POPUP, { component: 'DataInfoPopup' });
          track(EVENT_CLICK_DATA_INFO_BUTTON);
        }
      } catch (error) {
        console.error('Error toggling DataInfoPopup:', error);
        // Still toggle the popup even if tracking fails
        baseToggle();
      }
    };

    /**
     * Track clicks on outbound links.
     *
     * @param {string} url - The URL that was clicked.
     */
    const trackOutbound = url => {
      try {
        track(EVENT_CLICK_OUTBOUND_LINK, { url });
      } catch (error) {
        console.error('Error tracking outbound link:', error);
      }
    };

    return {
      isOpen,
      togglePopup,
      trackOutbound,
      showNotification: toRef(props, 'showNotification'),
      popupRef,
    };
  },
};
</script>
