/**
 * Global test setup for Vitest
 * 
 * This file runs before tests to set up the testing environment.
 */
import { vi } from 'vitest';

// Mock the environment variables for testing
// This creates a minimal environment.meta.env object similar to what Vite provides
vi.mock('import.meta.env', () => ({
  BASE_URL: '/',
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  VITE_POSTHOG_API_KEY: 'test-api-key',
  VITE_POSTHOG_HOST: 'https://test.posthog.com',
  VITE_MAP_DEFAULT_LAT: 40.7128,
  VITE_MAP_DEFAULT_LNG: -74.006,
  VITE_MAP_DEFAULT_ZOOM: 12,
  VITE_NOAA_API_BASE_URL: 'https://api.tidesandcurrents.noaa.gov',
  VITE_DATA_PATH: 'data',
}));

// Set up global mocks for browser APIs that might not be available in the test environment

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch API
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});