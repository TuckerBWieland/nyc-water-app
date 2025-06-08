<template>
  <PopupContainer
    :isOpen="isOpen"
    :isDarkMode="isDarkMode"
    title="Support the Project"
    @close="isOpen = false"
  >
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
  </PopupContainer>

  <PopupButton
    :isDarkMode="isDarkMode"
    icon="$"
    title="Donate"
    @click="togglePopup"
  />
</template>

<script>
import { usePopupAnalytics } from '../composables/usePopupAnalytics';
import {
  track,
  EVENT_CLICK_DONATE_BUTTON,
  EVENT_CLICK_OUTBOUND_LINK,
} from '../services/analytics';
import PopupContainer from './PopupContainer.vue';
import PopupButton from './PopupButton.vue';

export default {
  name: 'DonatePopup',
  components: {
    PopupContainer,
    PopupButton,
  },
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
    const { isOpen, togglePopup } = usePopupAnalytics(
      'donate',
      'DonatePopup',
      EVENT_CLICK_DONATE_BUTTON
    );

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
    };
  },
};
</script>