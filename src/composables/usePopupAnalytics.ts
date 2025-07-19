import { usePopupManager } from './usePopupManager';
import { track, EVENT_OPEN_POPUP } from '../services/analytics';

/**
 * Manage popup visibility with integrated analytics tracking.
 *
 * @param {string} name - Unique popup identifier for usePopupManager.
 * @param {string} component - Component name for analytics events.
 * @param {string} [buttonEvent] - Optional analytics event for button clicks.
 */
export function usePopupAnalytics(name: string, component: any, buttonEvent: string) {
  const { isOpen, togglePopup: baseToggle, closePopup } = usePopupManager(name);

  /**
   * Toggle popup visibility and track opening events.
   *
   * @param {boolean} [trackEvent=true] - Whether to log analytics events.
   */
  const togglePopup = (trackEvent = true) => {
    try {
      const wasClosed = !isOpen.value;
      baseToggle();
      if (wasClosed && trackEvent) {
        track(EVENT_OPEN_POPUP, { component });
        if (buttonEvent) {
          track(buttonEvent);
        }
      }
    } catch (error) {
      console.error(`Error toggling ${component}:`, error);
      // Ensure popup still toggles if tracking fails
      baseToggle();
    }
  };

  return { isOpen, togglePopup, closePopup };
}
