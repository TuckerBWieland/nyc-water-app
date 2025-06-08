import { ref, computed } from 'vue';

// Holds the name of the currently open popup
const activePopup = ref(null);

/**
 * Reactive flag indicating if any popup is open.
 * Other components can use this to react when a popup is visible.
 * @type {import('vue').ComputedRef<boolean>}
 */
export const anyPopupOpen = computed(() => activePopup.value !== null);

/**
 * Provides reactive open state management for popups.
 * Only one popup can be open at a time.
 * @param {string} name - Unique name for the popup using this composable
 */
export function usePopupManager(name) {
  const isOpen = computed({
    get: () => activePopup.value === name,
    set: val => {
      if (val) {
        activePopup.value = name;
      } else if (activePopup.value === name) {
        activePopup.value = null;
      }
    },
  });

  /**
   * Toggle the open state of this popup.
   */
  const togglePopup = () => {
    isOpen.value = !isOpen.value;
  };

  /**
   * Force the popup to close if it is currently active.
   */
  const closePopup = () => {
    if (activePopup.value === name) {
      activePopup.value = null;
    }
  };

  return { isOpen, togglePopup, closePopup };
}
