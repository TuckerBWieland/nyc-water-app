/**
 * Composable for data fetching operations with error handling and state management
 */
import { ref } from 'vue';
import { handleError, handleAsyncOperation, ErrorSeverity } from '../utils/errorHandler';
import { analytics, AnalyticsEvent } from '../services/analytics';
import config from '../config';
import { isGeoJSONCollection } from '../types/geojson';
/** Data fetching status */
export var FetchStatus;
(function (FetchStatus) {
  FetchStatus['IDLE'] = 'idle';
  FetchStatus['LOADING'] = 'loading';
  FetchStatus['SUCCESS'] = 'success';
  FetchStatus['ERROR'] = 'error';
})(FetchStatus || (FetchStatus = {}));
/**
 * Hook for fetching data with built-in error handling and state management
 *
 * @param options - Configuration options for data fetching
 * @returns Object with data, status, error, and control functions
 */
export function useDataFetching(options = {}) {
  const {
    baseUrl = import.meta.env.BASE_URL,
    autoFetch = false,
    trackAnalytics = true,
    dataPath = config.paths.data,
    dateFormat = 'YYYY-MM-DD',
    tryEnriched = true,
  } = options;
  // State
  const data = ref(null);
  const status = ref(FetchStatus.IDLE);
  const error = ref(null);
  const lastFetchedDate = ref(null);
  /**
   * Fetch data for a specific date
   *
   * @param date - Date string in the specified format
   * @returns Promise resolving to the fetched data or null
   */
  const fetchForDate = async date => {
    // Update state
    status.value = FetchStatus.LOADING;
    error.value = null;
    lastFetchedDate.value = date;
    // Track analytics event if enabled
    if (trackAnalytics) {
      analytics.track(AnalyticsEvent.SELECTED_DATE, { date });
    }
    const result = await handleAsyncOperation(
      async () => {
        // Construct the URL based on the date format and path
        const url = `${baseUrl}${dataPath}/${date}.geojson`;
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
          error.value = `Failed to load data: ${response.status} ${response.statusText}`;
          return null;
        }
        // Parse the response
        const responseData = await response.json();
        // Validate data if it's a GeoJSON collection
        if (responseData && typeof responseData === 'object' && 'type' in responseData) {
          if (!isGeoJSONCollection(responseData)) {
            // Handle invalid data format
            status.value = FetchStatus.ERROR;
            error.value = 'Invalid data format: Not a valid GeoJSON collection';
            return null;
          }
        }
        // Set the base data
        data.value = responseData;
        // Try to load enriched version if enabled
        if (tryEnriched) {
          await handleAsyncOperation(
            async () => {
              const enrichedUrl = `${baseUrl}${dataPath}/${date}.enriched.geojson`;
              const enrichedResponse = await fetch(enrichedUrl);
              if (enrichedResponse.ok) {
                const enrichedData = await enrichedResponse.json();
                // Validate enriched data
                if (isGeoJSONCollection(enrichedData)) {
                  data.value = enrichedData;
                }
              }
            },
            { component: 'useDataFetching', operation: 'fetchEnrichedData' },
            { logToConsole: true, reportToAnalytics: true }
          );
        }
        // Update state to success
        status.value = FetchStatus.SUCCESS;
        return data.value;
      },
      { component: 'useDataFetching', operation: 'fetchForDate', data: { date } },
      {
        logToConsole: true,
        reportToAnalytics: true,
        fallbackValue: null,
        rethrow: false,
      }
    );
    // Return null if no data was returned
    return result.data;
  };
  /**
   * Retry the last fetch operation
   *
   * @returns Promise resolving to the fetched data or null
   */
  const retry = async () => {
    if (lastFetchedDate.value) {
      return fetchForDate(lastFetchedDate.value);
    }
    error.value = 'No previous fetch to retry';
    return null;
  };
  // Auto-fetch if enabled (would need a default date)
  if (autoFetch && lastFetchedDate.value) {
    fetchForDate(lastFetchedDate.value).catch(err => {
      handleError(
        err,
        { component: 'useDataFetching', operation: 'autoFetch' },
        ErrorSeverity.ERROR
      );
    });
  }
  return {
    data: data,
    status,
    error,
    fetchForDate,
    retry,
  };
}
