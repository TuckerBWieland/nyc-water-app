/**
 * Analytics type definitions
 */

/**
 * Valid event names for analytics tracking
 */
export enum AnalyticsEvent {
  VIEWED_PAGE = 'viewed_page',
  VIEWED_SAMPLE_PIN = 'viewed_sample_pin',
  CHANGED_THEME = 'changed_theme',
  SELECTED_DATE = 'selected_date',
  ZOOMED_MAP = 'zoomed_map',
  PANNED_MAP = 'panned_map',
  FAILED_LOADING_DATA = 'failed_loading_data',
  ERROR_OCCURRED = 'error_occurred',
}

/**
 * Types for different event payloads
 */
export interface ViewedPagePayload {
  page: string;
  referrer?: string;
}

export interface ViewedSamplePinPayload {
  sampleId: string;
  location?: string;
  result?: string;
}

export interface ChangedThemePayload {
  theme: 'light' | 'dark';
  previousTheme?: 'light' | 'dark';
}

export interface SelectedDatePayload {
  date: string;
  previousDate?: string;
}

export interface ZoomedMapPayload {
  zoomLevel: number;
  previousZoomLevel?: number;
}

export interface PannedMapPayload {
  center: {
    lat: number;
    lng: number;
  };
}

export interface FailedLoadingDataPayload {
  error: string;
  date?: string;
}

export interface ErrorOccurredPayload {
  error_message: string;
  error_type: string;
  component?: string;
  operation?: string;
  severity: string;
}

/**
 * Union type of all possible event payloads
 */
export type EventPayload =
  | ViewedPagePayload
  | ViewedSamplePinPayload
  | ChangedThemePayload
  | SelectedDatePayload
  | ZoomedMapPayload
  | PannedMapPayload
  | FailedLoadingDataPayload
  | ErrorOccurredPayload;

/**
 * Type that maps event names to their respective payload types
 */
export type EventPayloadMap = {
  [AnalyticsEvent.VIEWED_PAGE]: ViewedPagePayload;
  [AnalyticsEvent.VIEWED_SAMPLE_PIN]: ViewedSamplePinPayload;
  [AnalyticsEvent.CHANGED_THEME]: ChangedThemePayload;
  [AnalyticsEvent.SELECTED_DATE]: SelectedDatePayload;
  [AnalyticsEvent.ZOOMED_MAP]: ZoomedMapPayload;
  [AnalyticsEvent.PANNED_MAP]: PannedMapPayload;
  [AnalyticsEvent.FAILED_LOADING_DATA]: FailedLoadingDataPayload;
  [AnalyticsEvent.ERROR_OCCURRED]: ErrorOccurredPayload;
};

/**
 * Generic user traits for identification
 */
export interface UserTraits {
  [key: string]: any;
  name?: string;
  email?: string;
}
