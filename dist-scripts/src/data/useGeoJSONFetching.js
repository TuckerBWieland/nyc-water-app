/**
 * Specialized composable for GeoJSON data fetching operations
 * with error handling and state management
 */
import { ref } from 'vue';
import { analytics, AnalyticsEvent } from '../analytics';
import config from '../config';
import { isGeoJSONCollection } from './types';
/** Data fetching status */
export var FetchStatus;
(function (FetchStatus) {
  FetchStatus['IDLE'] = 'idle';
  FetchStatus['LOADING'] = 'loading';
  FetchStatus['SUCCESS'] = 'success';
  FetchStatus['ERROR'] = 'error';
})(FetchStatus || (FetchStatus = {}));
/**
 * Type-specific hook for fetching GeoJSON data with
 * error handling and state management
 *
 * @param options - Configuration options for data fetching
 * @returns Object with data, status, error, and control functions
 */
export function useGeoJSONFetching(options = {}) {
  const {
    baseUrl = import.meta.env.BASE_URL,
    trackAnalytics = true,
    dataPath = config.paths.data,
    tryEnriched = true,
  } = options;
  // State
  const data = ref(null);
  const status = ref(FetchStatus.IDLE);
  const error = ref(null);
  const currentDate = ref(null);
  /**
   * Creates error context for async operations
   */
  const createContext = (operation, extraData) => ({
    component: 'useGeoJSONFetching',
    operation,
    data: extraData,
  });
  /**
   * Fetch data for a specific date
   *
   * @param date - Date string in the format YYYY-MM-DD
   * @returns Promise resolving to a result object with data and error fields
   */
  const fetchForDate = async date => {
    // Update state
    status.value = FetchStatus.LOADING;
    error.value = null;
    currentDate.value = date;
    // Track analytics event if enabled
    if (trackAnalytics) {
      analytics.track(AnalyticsEvent.SELECTED_DATE, { date });
    }
    // Construct the URL based on the date format and path
    const url = `${baseUrl}${dataPath}/${date}.geojson`;
    try {
      // Fetch the data
      const response = await fetch(url);
      if (!response.ok) {
        if (trackAnalytics) {
          analytics.track(AnalyticsEvent.FAILED_LOADING_DATA, {
            date,
            error: `${response.status} ${response.statusText}`,
          });
        }
        // Update state to error
        status.value = FetchStatus.ERROR;
        const fetchError = new Error(
          `Failed to load data: ${response.status} ${response.statusText}`
        );
        error.value = fetchError;
        return { data: null, error: fetchError };
      }
      // Parse the response
      const responseData = await response.json();
      // Validate GeoJSON data
      if (!isGeoJSONCollection(responseData)) {
        status.value = FetchStatus.ERROR;
        const validationError = new Error('Invalid data format: Not a valid GeoJSON collection');
        error.value = validationError;
        return { data: null, error: validationError };
      }
      // Set the base data
      data.value = responseData;
      // Try to load enriched version if enabled
      if (tryEnriched) {
        const enrichedUrl = `${baseUrl}${dataPath}/${date}.enriched.geojson`;
        try {
          const enrichedResponse = await fetch(enrichedUrl);
          if (enrichedResponse.ok) {
            const enrichedData = await enrichedResponse.json();
            // Validate enriched data
            if (isGeoJSONCollection(enrichedData)) {
              data.value = enrichedData;
            }
          }
        } catch (enrichError) {
          // Non-critical error, just log it
          console.warn('Failed to load enriched data:', enrichError);
        }
      }
      // Update state to success
      status.value = FetchStatus.SUCCESS;
      return { data: data.value, error: null };
    } catch (err) {
      // Handle unexpected errors
      status.value = FetchStatus.ERROR;
      const fetchError = err instanceof Error ? err : new Error(String(err));
      error.value = fetchError;
      return { data: null, error: fetchError };
    }
  };
  /**
   * Retry the last fetch operation
   *
   * @returns Promise resolving to a result object with data and error fields
   */
  const retry = async () => {
    if (currentDate.value) {
      return fetchForDate(currentDate.value);
    }
    const noFetchError = new Error('No previous fetch to retry');
    error.value = noFetchError;
    return { data: null, error: noFetchError };
  };
  return {
    data,
    status,
    error,
    fetchForDate,
    retry,
    currentDate,
  };
}
