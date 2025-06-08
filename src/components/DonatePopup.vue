<template>
  <div
    v-if="isOpen"
    ref="popupRef"
    @click.stop
    :class="[
      'fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 p-4 sm:p-6 rounded-lg shadow-lg z-[400] w-[95%] sm:w-[600px] max-w-[95vw] sm:max-w-[800px] transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black',
    ]"
  >
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">Support the Project</h3>
      <button
        :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
        @click="isOpen = false"
      >
        &times;
      </button>
    </div>
    <div class="prose text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
      <p class="mb-2">Help expand water quality monitoring by donating or volunteering.</p>
      <ul class="list-disc pl-5">
        <li>
          <a
            href="https://www.billionoysterproject.org/donate"
            target="_blank"
            rel="noopener"
            @click="trackOutbound('https://www.billionoysterproject.org/donate')"
            >Billion Oyster Project</a
          >
        </li>
        <li>
          <a
            href="https://www.newtowncreekalliance.org/donate/"
            target="_blank"
            rel="noopener"
            @click="trackOutbound('https://www.newtowncreekalliance.org/donate/')"
            >Newtown Creek Alliance</a
          >
        </li>
      </ul>
    </div>
  </div>

  <button
    :class="[
      'rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300 pointer-events-auto touch-action-manipulation',
      isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
    ]"
    :style="{ pointerEvents: 'auto', touchAction: 'manipulation' }"
    title="Donate"
    @click.stop="togglePopup"
    @touchstart.stop.prevent="togglePopup"
  >
    <span class="font-semibold text-lg pointer-events-none">$</span>
  </button>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue';
import { usePopupManager } from '../composables/usePopupManager';
import {
  track,
  EVENT_CLICK_DONATE_BUTTON,
  EVENT_CLICK_OUTBOUND_LINK,
  EVENT_OPEN_POPUP,
} from '../services/analytics';

export default {
  name: 'DonatePopup',
  props: {
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  /**
   * Setup function for the DonatePopup component.
   * Manages popup state and analytics tracking.
   *
   * @returns {Object} Reactive bindings for the template.
   */
  setup() {
    const { isOpen, togglePopup: baseToggle, closePopup } = usePopupManager('donate');
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
     * Toggle popup visibility and log analytics events.
     */
    const togglePopup = () => {
      try {
        const wasClosed = !isOpen.value;
        baseToggle();
        if (wasClosed) {
          track(EVENT_OPEN_POPUP, { component: 'DonatePopup' });
          track(EVENT_CLICK_DONATE_BUTTON);
        }
      } catch (error) {
        console.error('Error toggling DonatePopup:', error);
        // Still toggle the popup even if tracking fails
        baseToggle();
      }
    };

    /**
     * Track clicks on outbound donation links.
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
      popupRef,
    };
  },
};
</script>
