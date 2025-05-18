/**
 * Centralized error handling utility for consistent error management across the application.
 * Handles logging, user notifications, and consistent error result formats.
 */

import { analytics } from '../services/analytics';

/**
 * Error severity levels to categorize different types of errors
 */
export const ErrorSeverity = {
  INFO: 'info', // Non-critical errors that don't impact core functionality
  WARNING: 'warning', // Potential issues that might affect some functionality
  ERROR: 'error', // Serious errors that impact functionality but don't crash the app
  FATAL: 'fatal', // Critical errors that prevent core app functionality
};

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
  /**
   * Add an error message to the notification queue
   * @param {string} message - Error message to display
   * @param {string} severity - Error severity level
   */
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
 * @param {Error|any} error - The error object
 * @param {Object} context - Additional context for the error
 * @param {string} severity - How severe the error is
 * @param {Object} options - Configuration for how to handle the error
 * @returns {Object} Formatted error result
 */
export function handleError(
  error,
  context = {},
  severity = ErrorSeverity.ERROR,
  options = {}
) {
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
  if (opts.reportToAnalytics && analytics.track) {
    analytics.track('error_occurred', {
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
 * @param {Function} fn - Async function to execute
 * @param {Object} context - Error context
 * @param {Object} options - Error handling options
 * @returns {Promise<Object>} Promise resolving to structured response with data and error fields
 */
export async function handleAsyncOperation(
  fn,
  context = {},
  options = {}
) {
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
 * @param {Function} fn - Function to wrap with error handling
 * @param {Object} context - Error context
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling and consistent return type
 */
export function withErrorHandling(
  fn,
  context = {},
  options = {}
) {
  return (...args) => {
    try {
      const result = fn(...args);
      return { data: result, error: null };
    } catch (error) {
      return handleError(error, context, ErrorSeverity.ERROR, options);
    }
  };
}