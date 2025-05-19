/**
 * Composable for static data management that replaces dynamic fetch operations
 * This loads all data from a pre-compiled JSON file, improving performance and reliability
 */
import { ref, computed, watch, onMounted } from 'vue';
import { handleError, handleAsyncOperation, ErrorSeverity } from '../utils/errorHandler.js';
import { analytics } from '../services/analytics/index.js';
import config from '../config/index.js';

/**
 * Hook for accessing pre-compiled static data
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.trackAnalytics=true] - Track analytics for data selection events
 * @returns {Object} Object with dates, selected date ref, current data computed property, and control functions
 */
export function useStaticData(options = {}) {
  const { trackAnalytics = true } = options;

  // State
  const selectedDate = ref(null);
  const availableDates = ref([]);
  const isLoading = ref(true);
  const staticData = ref({});
  const currentData = ref(null);
  
  // Try to get data from the static file or fetch it dynamically
  let devMode = false;

  // Load dates and initial data
  onMounted(async () => {
    await handleAsyncOperation(
      async () => {
        try {
          // Try to load the static all-data.json file
          const module = await import('../data/all-data.json');
          const allData = module.default;
          
          // Initialize data from the static file
          availableDates.value = allData.dates || [];
          staticData.value = allData.data || {};
          selectedDate.value = allData.latest || 
            (availableDates.value.length > 0 ? availableDates.value[availableDates.value.length - 1] : null);
        } catch (error) {
          // In development mode, the static file might not exist yet
          console.warn('Static data file not found. Using fallback data. Run build process to generate the full data file.');
          devMode = true;
          
          // Fallback to fetching the index.json for dates
          try {
            const response = await fetch(`${import.meta.env.BASE_URL}data/index.json`);
            if (response.ok) {
              const indexData = await response.json();
              availableDates.value = indexData.dates || [];
              selectedDate.value = indexData.latest || 
                (availableDates.value.length > 0 ? availableDates.value[availableDates.value.length - 1] : null);
            }
          } catch (indexError) {
            console.error('Failed to fetch index data as fallback:', indexError);
          }
        }
        
        // Update data when selectedDate changes
        isLoading.value = false;
      },
      { component: 'useStaticData', operation: 'loadData' },
      {
        logToConsole: true,
        reportToAnalytics: false,
        showToUser: false,
      }
    );
  });

  // Watch for changes in selected date and update current data
  watch(selectedDate, async (newDate) => {
    if (!newDate) return;
    
    // Track analytics event if enabled
    if (trackAnalytics) {
      analytics.track('selected_date', { date: newDate });
    }
    
    // If we have the data in our static data object, use it
    if (staticData.value[newDate]) {
      currentData.value = staticData.value[newDate];
      return;
    }
    
    // Otherwise, in development mode, fetch it
    if (devMode) {
      isLoading.value = true;
      
      try {
        // Try to fetch enriched version first
        let response = await fetch(
          `${import.meta.env.BASE_URL}data/enriched/${newDate}.enriched.geojson`
        );
        
        if (response.ok) {
          const data = await response.json();
          staticData.value[newDate] = data;
          currentData.value = data;
          isLoading.value = false;
          return;
        }
        
        // If enriched fails, try the regular version
        response = await fetch(
          `${import.meta.env.BASE_URL}data/geojson/${newDate}.geojson`
        );
        
        if (response.ok) {
          const data = await response.json();
          staticData.value[newDate] = data;
          currentData.value = data;
          isLoading.value = false;
          return;
        }
        
        // If both fail, set empty data
        console.error(`No data available for ${newDate}`);
        currentData.value = { type: "FeatureCollection", features: [] };
      } catch (error) {
        console.error(`Error fetching data for ${newDate}:`, error);
        currentData.value = { type: "FeatureCollection", features: [] };
      } finally {
        isLoading.value = false;
      }
    }
  }, { immediate: true });

  /**
   * Select a different date
   *
   * @param {string} date - Date string to select
   * @returns {boolean} Success flag
   */
  const selectDate = (date) => {
    // Validate that the date exists in our data
    if (!date || !availableDates.value.includes(date)) {
      handleError(
        new Error(`Date not available: ${date}`),
        { component: 'useStaticData', operation: 'selectDate' },
        ErrorSeverity.WARNING,
        { showToUser: false }
      );
      return false;
    }

    // Set the new date
    selectedDate.value = date;
    
    return true;
  };

  /**
   * Get the next available date
   *
   * @returns {string|null} The next date or null if no next date
   */
  const getNextDate = () => {
    if (!selectedDate.value || availableDates.value.length === 0) {
      return null;
    }
    
    const currentIndex = availableDates.value.indexOf(selectedDate.value);
    if (currentIndex === -1 || currentIndex === availableDates.value.length - 1) {
      return null; // Current date not found or already at the last date
    }
    
    return availableDates.value[currentIndex + 1];
  };

  /**
   * Get the previous available date
   *
   * @returns {string|null} The previous date or null if no previous date
   */
  const getPrevDate = () => {
    if (!selectedDate.value || availableDates.value.length === 0) {
      return null;
    }
    
    const currentIndex = availableDates.value.indexOf(selectedDate.value);
    if (currentIndex <= 0) {
      return null; // Current date not found or already at the first date
    }
    
    return availableDates.value[currentIndex - 1];
  };

  /**
   * Select the latest available date
   *
   * @returns {boolean} Success flag
   */
  const selectLatestDate = () => {
    if (availableDates.value.length > 0) {
      // Use the last date in the array
      return selectDate(availableDates.value[availableDates.value.length - 1]);
    }
    
    return false;
  };

  return {
    currentData,
    selectedDate,
    availableDates: availableDates.value,
    isLoading,
    selectDate,
    getNextDate,
    getPrevDate,
    selectLatestDate,
  };
}