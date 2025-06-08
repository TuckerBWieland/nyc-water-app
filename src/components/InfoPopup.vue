<template>
  <PopupContainer
    :isOpen="isOpen"
    :isDarkMode="isDarkMode"
    title="About This Map"
    @close="isOpen = false"
  >
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
  </PopupContainer>

  <PopupButton
    :isDarkMode="isDarkMode"
    icon="i"
    title="Information"
    @click="togglePopup"
  />
</template>

<script>
import { onMounted } from 'vue';
import { usePopupManager } from '../composables/usePopupManager';
import { track, EVENT_OPEN_POPUP } from '../services/analytics';
import PopupContainer from './PopupContainer.vue';
import PopupButton from './PopupButton.vue';

export default {
  name: 'InfoPopup',
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
   * Setup function for the InfoPopup component.
   * Handles popup visibility and first-run behavior.
   *
   * @returns {Object} Reactive bindings for the template.
   */
  setup() {
    const { isOpen, togglePopup: baseToggle } = usePopupManager('info');

    /**
     * Toggle popup visibility and optionally track an analytics event.
     *
     * @param {boolean} [trackEvent=true] - Whether to log the open event.
     */
    const togglePopup = (trackEvent = true) => {
      try {
        const wasClosed = !isOpen.value;
        baseToggle();
        if (wasClosed && trackEvent) {
          track(EVENT_OPEN_POPUP, { component: 'InfoPopup' });
        }
      } catch (error) {
        console.error('Error toggling InfoPopup:', error);
        // Still toggle the popup even if tracking fails
        baseToggle();
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