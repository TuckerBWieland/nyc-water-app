/**
 * Centralized error handling utility for consistent error management across the application.
 * Handles logging, user notifications, and consistent error result formats.
 */
/**
 * Error severity levels to categorize different types of errors
 */
export declare enum ErrorSeverity {
    INFO = "info",// Non-critical errors that don't impact core functionality
    WARNING = "warning",// Potential issues that might affect some functionality
    ERROR = "error",// Serious errors that impact functionality but don't crash the app
    FATAL = "fatal"
}
/**
 * Interface for structured error context
 */
export interface ErrorContext {
    component?: string;
    operation?: string;
    data?: Record<string, any>;
    userId?: string;
}
/**
 * Options for error handling behavior
 */
export interface ErrorHandlingOptions {
    logToConsole?: boolean;
    reportToAnalytics?: boolean;
    rethrow?: boolean;
    showToUser?: boolean;
    fallbackValue?: any;
}
/**
 * Consistent return type for async operations
 */
export interface AsyncResult<T> {
    data: T | null;
    error: Error | null;
}
/**
 * Global state for error notifications that components can subscribe to
 */
export declare const errorNotifications: {
    messages: Array<{
        message: string;
        severity: ErrorSeverity;
    }>;
    addError(message: string, severity: ErrorSeverity): void;
    clearErrors(): void;
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
export declare function handleError<T>(error: Error | unknown, context?: ErrorContext, severity?: ErrorSeverity, options?: ErrorHandlingOptions): AsyncResult<T>;
/**
 * Wrapper utility to handle async function errors with consistent return types
 *
 * @param fn - Async function to execute
 * @param context - Error context
 * @param options - Error handling options
 * @returns Promise resolving to structured response with data and error fields
 */
export declare function handleAsyncOperation<T>(fn: () => Promise<T>, context?: ErrorContext, options?: ErrorHandlingOptions): Promise<AsyncResult<T>>;
/**
 * Higher-order function that wraps a function with error handling
 * Uses the consistent AsyncResult return type
 *
 * @param fn - Function to wrap with error handling
 * @param context - Error context
 * @param options - Error handling options
 * @returns Wrapped function with error handling and consistent return type
 */
export declare function withErrorHandling<T extends (...args: any[]) => any>(fn: T, context?: ErrorContext, options?: ErrorHandlingOptions): (...args: Parameters<T>) => AsyncResult<ReturnType<T>>;
