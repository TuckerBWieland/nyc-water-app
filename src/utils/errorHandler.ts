/**
 * Centralized error handling utility for consistent error management across the application.
 * Handles logging, user notifications, and fallback behaviors.
 */

import { analytics, AnalyticsEvent } from '../services/analytics';

/**
 * Error severity levels to categorize different types of errors
 */
export enum ErrorSeverity {
  INFO = 'info',       // Non-critical errors that don't impact core functionality
  WARNING = 'warning', // Potential issues that might affect some functionality
  ERROR = 'error',     // Serious errors that impact functionality but don't crash the app
  FATAL = 'fatal'      // Critical errors that prevent core app functionality
}

/**
 * Interface for structured error context
 */
export interface ErrorContext {
  component?: string;   // Component where error occurred
  operation?: string;   // Operation being performed (e.g., "fetchData", "renderMap")
  data?: Record<string, any>; // Any relevant data for debugging
  userId?: string;      // User ID if applicable
}

/**
 * Options for error handling behavior
 */
export interface ErrorHandlingOptions {
  logToConsole?: boolean;   // Whether to log to console
  reportToAnalytics?: boolean; // Whether to send to analytics
  rethrow?: boolean;        // Whether to rethrow the error
  showToUser?: boolean;     // Whether to show error to user
  fallbackValue?: any;      // Value to return as fallback
}

// Default options for error handling
const defaultOptions: ErrorHandlingOptions = {
  logToConsole: true,
  reportToAnalytics: true,
  rethrow: false,
  showToUser: false
};

/**
 * Global state for error notifications that components can subscribe to
 */
export const errorNotifications: {
  messages: Array<{message: string; severity: ErrorSeverity}>;
  addError: (message: string, severity: ErrorSeverity) => void;
  clearErrors: () => void;
} = {
  messages: [],
  addError(message: string, severity: ErrorSeverity) {
    this.messages.push({ message, severity });
    // In a real app, you would make this reactive with Vue's ref/reactive
  },
  clearErrors() {
    this.messages = [];
  }
};

/**
 * Main error handling function that processes errors according to specified options
 * 
 * @param error - The error object
 * @param context - Additional context for the error
 * @param severity - How severe the error is
 * @param options - Configuration for how to handle the error
 * @returns The fallback value if specified
 */
export function handleError<T = void>(
  error: Error | unknown,
  context: ErrorContext = {},
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  options: ErrorHandlingOptions = {}
): T | undefined {
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
    severity
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
      severity
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
  
  // Return fallback value if provided
  return opts.fallbackValue as T;
}

/**
 * Wrapper utility to handle async function errors
 * 
 * @param fn - Async function to execute
 * @param context - Error context
 * @param options - Error handling options
 * @returns Promise resolving to the function result or fallback
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {},
  options: ErrorHandlingOptions = {}
): Promise<T | undefined | null> {
  try {
    return await fn();
  } catch (error) {
    return handleError<T>(error, context, ErrorSeverity.ERROR, options);
  }
}

/**
 * Higher-order function that wraps a function with error handling
 * 
 * @param fn - Function to wrap with error handling
 * @param context - Error context
 * @param options - Error handling options
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {},
  options: ErrorHandlingOptions = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      return handleError<ReturnType<T>>(error, context, ErrorSeverity.ERROR, options);
    }
  };
}