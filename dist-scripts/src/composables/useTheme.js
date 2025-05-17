/**
 * Composable for managing theme (dark/light mode) with system preference detection
 */
import { ref, watch, onMounted } from 'vue';
import { analytics, AnalyticsEvent } from '../services/analytics';
/**
 * Composable for theme management with system preference detection
 * @param options - Configuration options
 * @returns Theme state and control functions
 */
export function useTheme(options = {}) {
  const {
    defaultTheme = 'system',
    storageKey = 'theme-preference',
    trackAnalytics = true,
    darkModeClass = 'dark',
  } = options;
  // State
  const preference = ref(defaultTheme);
  const isDarkMode = ref(false);
  /**
   * Detect system color scheme preference
   * @returns True if system prefers dark mode
   */
  const getSystemPreference = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  /**
   * Load saved preference from local storage
   */
  const loadSavedPreference = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        preference.value = saved;
      }
    } catch (e) {
      console.warn('Failed to load theme preference from localStorage', e);
    }
  };
  /**
   * Save preference to local storage
   */
  const savePreference = () => {
    try {
      localStorage.setItem(storageKey, preference.value);
    } catch (e) {
      console.warn('Failed to save theme preference to localStorage', e);
    }
  };
  /**
   * Update the document classes based on current theme
   */
  const applyTheme = () => {
    // Determine if dark mode based on preference
    const newDarkMode =
      preference.value === 'system' ? getSystemPreference() : preference.value === 'dark';
    // Apply CSS classes
    if (newDarkMode) {
      document.documentElement.classList.add(darkModeClass);
    } else {
      document.documentElement.classList.remove(darkModeClass);
    }
    // Track changes if preference changed
    if (isDarkMode.value !== newDarkMode && trackAnalytics) {
      analytics.track(AnalyticsEvent.CHANGED_THEME, {
        theme: newDarkMode ? 'dark' : 'light',
        previousTheme: isDarkMode.value ? 'dark' : 'light',
      });
    }
    // Update state
    isDarkMode.value = newDarkMode;
  };
  /**
   * Set theme preference and apply it
   * @param theme - New theme preference
   */
  const setTheme = theme => {
    preference.value = theme;
    savePreference();
    applyTheme();
  };
  /**
   * Toggle between light and dark mode
   */
  const toggleDarkMode = () => {
    // If currently using system preference, set explicit preference
    if (preference.value === 'system') {
      setTheme(isDarkMode.value ? 'light' : 'dark');
      return;
    }
    // Otherwise toggle between light/dark
    setTheme(preference.value === 'dark' ? 'light' : 'dark');
  };
  /**
   * Listen for system preference changes
   */
  const setupSystemListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Initial setup
    if (preference.value === 'system') {
      isDarkMode.value = mediaQuery.matches;
    }
    // Listen for changes
    const handleChange = () => {
      if (preference.value === 'system') {
        applyTheme();
      }
    };
    // Add event listener with compatibility
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  };
  // Watch for changes to preference
  watch(preference, () => {
    applyTheme();
  });
  // Initialize on component mount
  onMounted(() => {
    loadSavedPreference();
    applyTheme();
    setupSystemListener();
  });
  return {
    isDarkMode,
    preference,
    setTheme,
    toggleDarkMode,
  };
}
