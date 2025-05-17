/**
 * Specialized composable for GeoJSON data fetching operations
 * with error handling and state management
 */
import { Ref } from 'vue';
import { AsyncResult } from '../utils/errorHandler';
import { GeoJSONCollection } from './types';
/** Data fetching status */
export declare enum FetchStatus {
    IDLE = "idle",
    LOADING = "loading",
    SUCCESS = "success",
    ERROR = "error"
}
/** GeoJSON data fetching options */
export interface GeoJSONFetchOptions {
    /** Base URL for data fetching */
    baseUrl?: string;
    /** Track analytics for fetch operations */
    trackAnalytics?: boolean;
    /** Path prefix for data files */
    dataPath?: string;
    /** Try to load enriched version if available */
    tryEnriched?: boolean;
}
/** Result interface for GeoJSON fetching */
export interface GeoJSONFetchResult {
    /** The fetched GeoJSON data */
    data: Ref<GeoJSONCollection | null>;
    /** Current fetch status */
    status: Ref<FetchStatus>;
    /** Error message if fetch failed */
    error: Ref<Error | null>;
    /** Function to fetch data for a specific date */
    fetchForDate: (date: string) => Promise<AsyncResult<GeoJSONCollection>>;
    /** Function to retry the last fetch */
    retry: () => Promise<AsyncResult<GeoJSONCollection>>;
    /** Most recently fetched date */
    currentDate: Ref<string | null>;
}
/**
 * Type-specific hook for fetching GeoJSON data with
 * error handling and state management
 *
 * @param options - Configuration options for data fetching
 * @returns Object with data, status, error, and control functions
 */
export declare function useGeoJSONFetching(options?: GeoJSONFetchOptions): GeoJSONFetchResult;
