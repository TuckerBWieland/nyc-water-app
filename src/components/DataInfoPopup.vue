<template>
  <PopupContainer
    :isOpen="isOpen"
    :isDarkMode="isDarkMode"
    title="About the Data"
    @close="isOpen = false"
  >
    <p class="font-semibold mb-2">Key Finding: Location Matters More Than Rain</p>
    <p>
      Statistical analysis reveals that <strong>where you swim matters 3x more than when</strong> (after rain). 
      Location explains 20.5% of water quality variance while rainfall only explains 6.9%. Some sites are 
      chronically polluted due to poor water circulation, nearby outfalls, or wildlife, regardless of weather.
    </p>
    <p class="mt-3 font-semibold mb-2">Why rain still impacts water quality:</p>
    <p>
      When it rains heavily, New York City's sewer system—which combines sewage and stormwater in the same
      pipes—can become overwhelmed. To prevent backups into homes and streets, this excess mixture is
      discharged directly into waterways like Newtown Creek and the East River through Combined Sewer
      Overflows (CSOs). These overflows carry untreated sewage, bacteria, and other pollutants into the water,
      reducing water quality at affected sites.
    </p>
    <p class="mt-2 font-semibold mb-2">Where our rainfall and tide data come from:</p>
    <p>
      Rainfall data is sourced from NOAA's National Weather Service, specifically from the Central Park
      weather station. This provides a consistent benchmark for citywide precipitation.
    </p>
    <br>
    <p>
      Tide data comes from NOAA's tide predictions, using the Battery (NY) tidal station as a reference.
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
  </PopupContainer>

  <PopupButton
    :isDarkMode="isDarkMode"
    icon="?"
    title="Data information"
    variant="notification"
    :showNotification="showNotification"
    @click="togglePopup"
  />
</template>

<script>
import { toRef } from 'vue';
import { usePopupAnalytics } from '../composables/usePopupAnalytics';
import {
  track,
  EVENT_CLICK_DATA_INFO_BUTTON,
  EVENT_CLICK_OUTBOUND_LINK,
} from '../services/analytics';
import PopupContainer from './PopupContainer.vue';
import PopupButton from './PopupButton.vue';

export default {
  name: 'DataInfoPopup',
  components: {
    PopupContainer,
    PopupButton,
  },
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
    const { isOpen, togglePopup } = usePopupAnalytics(
      'data-info',
      'DataInfoPopup',
      EVENT_CLICK_DATA_INFO_BUTTON
    );

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
    };
  },
};
</script>