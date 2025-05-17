/**
 * Centralized error handling utility for consistent error management across the application.
 * Handles logging, user notifications, and consistent error result formats.
 */
import { analytics, AnalyticsEvent } from '../analytics';
/**
 * Error severity levels to categorize different types of errors
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
  ErrorSeverity['INFO'] = 'info';
  ErrorSeverity['WARNING'] = 'warning';
  ErrorSeverity['ERROR'] = 'error';
  ErrorSeverity['FATAL'] = 'fatal'; // Critical errors that prevent core app functionality
})(ErrorSeverity || (ErrorSeverity = {}));
// Default options for error handling
const defaultOptions = {
  logToConsole: true,
  reportToAnalytics: true,
  rethrow: false,
  showToUser: false,
};
/**
 * Global state for error notifications that components can subscribe to
 */
export const errorNotifications = {
  messages: [],
  addError(message, severity) {
    this.messages.push({ message, severity });
    // In a real app, you would make this reactive with Vue's ref/reactive
  },
  clearErrors() {
    this.messages = [];
  },
};
/**
 * Main error handling function that processes errors according to specified options
 *
 * @param error - The error object
 * @param context - Additional context for the error
 * @param severity - How severe the error is
 * @param options - Configuration for how to handle the error
 * @returns Formatted error result
 */
export function handleError(error, context = {}, severity = ErrorSeverity.ERROR, options = {}) {
  // Merge with default options
  const opts = { ...defaultOptions, ...options };
  // Ensure we have an Error object
  const errorObject = error instanceof Error ? error : new Error(String(error));
  // Construct error message with context
  const errorInfo = {
    message: errorObject.message,
    stack: errorObject.stack,
    ...context,
    timestamp: new Date().toISOString(),
    severity,
  };
  // Console logging
  if (opts.logToConsole) {
    console.error('[App Error]', errorInfo);
  }
  // Analytics reporting
  if (opts.reportToAnalytics) {
    analytics.track(AnalyticsEvent.ERROR_OCCURRED, {
      error_message: errorObject.message,
      error_type: errorObject.name,
      component: context.component,
      operation: context.operation,
      severity,
    });
  }
  // User notification for visible errors
  if (opts.showToUser) {
    errorNotifications.addError(errorObject.message, severity);
  }
  // Rethrow if specified
  if (opts.rethrow) {
    throw errorObject;
  }
  // Return consistent error result format
  return {
    data: null,
    error: errorObject,
  };
}
/**
 * Wrapper utility to handle async function errors with consistent return types
 *
 * @param fn - Async function to execute
 * @param context - Error context
 * @param options - Error handling options
 * @returns Promise resolving to structured response with data and error fields
 */
export async function handleAsyncOperation(fn, context = {}, options = {}) {
  try {
    const result = await fn();
    return {
      data: result,
      error: null,
    };
  } catch (error) {
    return handleError(error, context, ErrorSeverity.ERROR, options);
  }
}
/**
 * Higher-order function that wraps a function with error handling
 * Uses the consistent AsyncResult return type
 *
 * @param fn - Function to wrap with error handling
 * @param context - Error context
 * @param options - Error handling options
 * @returns Wrapped function with error handling and consistent return type
 */
export function withErrorHandling(fn, context = {}, options = {}) {
  return (...args) => {
    try {
      const result = fn(...args);
      return { data: result, error: null };
    } catch (error) {
      return handleError(error, context, ErrorSeverity.ERROR, options);
    }
  };
}
