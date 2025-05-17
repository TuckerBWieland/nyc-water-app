/**
 * Composable for data fetching operations with error handling and state management
 */
import { Ref, UnwrapRef } from 'vue';
/** Data fetching status */
export declare enum FetchStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
/** Data fetching options */
export interface FetchOptions {
  /** Base URL for data fetching */
  baseUrl?: string;
  /** Auto-fetch data on initialization */
  autoFetch?: boolean;
  /** Track analytics for fetch operations */
  trackAnalytics?: boolean;
  /** Path prefix for data files */
  dataPath?: string;
  /** The date format for filenames */
  dateFormat?: 'YYYY-MM-DD' | 'MM-DD-YYYY';
  /** Try to load enriched version if available */
  tryEnriched?: boolean;
}
/** Result of the data fetching hook */
export interface FetchResult<T> {
  /** The fetched data */
  data: Ref<UnwrapRef<T> | null>;
  /** Current fetch status */
  status: Ref<FetchStatus>;
  /** Error message if fetch failed */
  error: Ref<string | null>;
  /** Function to fetch data for a specific date */
  fetchForDate: (date: string) => Promise<T | null>;
  /** Function to retry the last fetch */
  retry: () => Promise<T | null>;
}
/**
 * Hook for fetching data with built-in error handling and state management
 *
 * @param options - Configuration options for data fetching
 * @returns Object with data, status, error, and control functions
 */
export declare function useDataFetching<T = any>(options?: FetchOptions): FetchResult<T>;
