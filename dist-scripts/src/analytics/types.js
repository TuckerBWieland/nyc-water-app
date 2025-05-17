/**
 * Analytics type definitions
 */
/**
 * Valid event names for analytics tracking
 */
export var AnalyticsEvent;
(function (AnalyticsEvent) {
  AnalyticsEvent['VIEWED_PAGE'] = 'viewed_page';
  AnalyticsEvent['VIEWED_SAMPLE_PIN'] = 'viewed_sample_pin';
  AnalyticsEvent['CHANGED_THEME'] = 'changed_theme';
  AnalyticsEvent['SELECTED_DATE'] = 'selected_date';
  AnalyticsEvent['ZOOMED_MAP'] = 'zoomed_map';
  AnalyticsEvent['PANNED_MAP'] = 'panned_map';
  AnalyticsEvent['FAILED_LOADING_DATA'] = 'failed_loading_data';
  AnalyticsEvent['ERROR_OCCURRED'] = 'error_occurred';
})(AnalyticsEvent || (AnalyticsEvent = {}));
