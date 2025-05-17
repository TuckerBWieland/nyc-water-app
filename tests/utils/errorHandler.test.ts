/**
 * Tests for error handling utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleError,
  handleAsyncError,
  withErrorHandling,
  ErrorSeverity,
} from '../../src/utils/errorHandler';
import { analytics } from '../../src/services/analytics';

// Mock the analytics service
vi.mock('../../src/services/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('handleError', () => {
    it('should log error to console when logToConsole is true', () => {
      const error = new Error('Test error');
      handleError(error, {}, ErrorSeverity.ERROR, { logToConsole: true });
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log error to console when logToConsole is false', () => {
      const error = new Error('Test error');
      handleError(error, {}, ErrorSeverity.ERROR, { logToConsole: false });
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should report error to analytics when reportToAnalytics is true', () => {
      const error = new Error('Test error');
      handleError(error, {}, ErrorSeverity.ERROR, { reportToAnalytics: true });
      expect(analytics.track).toHaveBeenCalled();
    });

    it('should not report error to analytics when reportToAnalytics is false', () => {
      const error = new Error('Test error');
      handleError(error, {}, ErrorSeverity.ERROR, { reportToAnalytics: false });
      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('should rethrow error when rethrow is true', () => {
      const error = new Error('Test error');
      expect(() => {
        handleError(error, {}, ErrorSeverity.ERROR, { rethrow: true });
      }).toThrow('Test error');
    });

    it('should not rethrow error when rethrow is false', () => {
      const error = new Error('Test error');
      expect(() => {
        handleError(error, {}, ErrorSeverity.ERROR, { rethrow: false });
      }).not.toThrow();
    });

    it('should return fallback value when provided', () => {
      const error = new Error('Test error');
      const fallback = 'fallback value';
      const result = handleError(error, {}, ErrorSeverity.ERROR, { fallbackValue: fallback });
      expect(result).toBe(fallback);
    });

    it('should handle non-Error objects', () => {
      const error = 'string error';
      handleError(error, {}, ErrorSeverity.ERROR);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleAsyncError', () => {
    it('should return result when async function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await handleAsyncError(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should handle error when async function fails', async () => {
      const error = new Error('Async error');
      const fn = vi.fn().mockRejectedValue(error);
      await handleAsyncError(fn);
      expect(fn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should return fallback value when async function fails and fallback is provided', async () => {
      const error = new Error('Async error');
      const fn = vi.fn().mockRejectedValue(error);
      const fallback = 'fallback value';
      const result = await handleAsyncError(fn, {}, { fallbackValue: fallback });
      expect(result).toBe(fallback);
    });
  });

  describe('withErrorHandling', () => {
    it('should return function result when it succeeds', () => {
      const fn = vi.fn().mockReturnValue('success');
      const wrappedFn = withErrorHandling(fn);
      const result = wrappedFn();
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should handle error when function throws', () => {
      const error = new Error('Function error');
      const fn = vi.fn().mockImplementation(() => {
        throw error;
      });
      const wrappedFn = withErrorHandling(fn);
      wrappedFn();
      expect(fn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should pass arguments to the wrapped function', () => {
      const fn = vi.fn().mockReturnValue('success');
      const wrappedFn = withErrorHandling(fn);
      wrappedFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should return fallback value when function throws and fallback is provided', () => {
      const error = new Error('Function error');
      const fn = vi.fn().mockImplementation(() => {
        throw error;
      });
      const fallback = 'fallback value';
      const wrappedFn = withErrorHandling(fn, {}, { fallbackValue: fallback });
      const result = wrappedFn();
      expect(result).toBe(fallback);
    });
  });
});
