<template>
  <div
    v-if="isOpen"
    :class="[
      'fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-40 max-w-md w-[90%] mx-auto transition-colors duration-300',
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
      'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 ml-[3rem] z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800',
    ]"
    title="Donate"
    @click="togglePopup"
  >
    <span class="font-semibold text-lg">$</span>
  </button>
</template>

<script>
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
  setup() {
    const { isOpen, togglePopup: baseToggle } = usePopupManager('donate');

    const togglePopup = () => {
      const wasClosed = !isOpen.value;
      baseToggle();
      if (wasClosed) {
        track(EVENT_OPEN_POPUP, { component: 'DonatePopup' });
        track(EVENT_CLICK_DONATE_BUTTON);
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
