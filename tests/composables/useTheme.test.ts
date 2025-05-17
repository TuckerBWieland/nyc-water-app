/**
 * Tests for useTheme composable
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTheme } from '../../src/composables/useTheme';
import { nextTick } from 'vue';

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset the document element class list
    document.documentElement.className = '';

    // Mock console.warn to avoid polluting test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with the default theme', () => {
    const { isDarkMode, preference } = useTheme();
    expect(preference.value).toBe('system');
    expect(isDarkMode.value).toBe(false); // Because our mock matchMedia returns false
  });

  it('should load saved preference from localStorage', () => {
    // Save a preference
    localStorage.setItem('theme-preference', 'dark');

    // Initialize the composable
    const { isDarkMode, preference } = useTheme();

    // Run onMounted hook
    nextTick(() => {
      expect(preference.value).toBe('dark');
      expect(isDarkMode.value).toBe(true);
    });
  });

  it('should apply dark mode class to document when dark mode is enabled', () => {
    const { setTheme } = useTheme({ defaultTheme: 'light', darkModeClass: 'dark-theme' });

    // Initial state should be light
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);

    // Set to dark mode
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should save preference to localStorage', () => {
    const { setTheme } = useTheme({ storageKey: 'test-theme' });

    setTheme('dark');
    expect(localStorage.getItem('test-theme')).toBe('dark');

    setTheme('light');
    expect(localStorage.getItem('test-theme')).toBe('light');
  });

  it('should toggle between light and dark mode', () => {
    const { toggleDarkMode, isDarkMode } = useTheme({ defaultTheme: 'light' });

    // Start with light mode
    expect(isDarkMode.value).toBe(false);

    // Toggle to dark mode
    toggleDarkMode();
    expect(isDarkMode.value).toBe(true);

    // Toggle back to light mode
    toggleDarkMode();
    expect(isDarkMode.value).toBe(false);
  });

  it('should handle system preference changes', () => {
    const { isDarkMode, preference } = useTheme({ defaultTheme: 'system' });

    // Initially system preference is false (light)
    expect(isDarkMode.value).toBe(false);

    // Change system preference to dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true, // Now prefers dark
        media: query,
        onchange: null,
        addListener: vi.fn(cb => cb()),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event, cb) => cb()),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Trigger media query change
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQueryList.addEventListener) {
      const event = new Event('change');
      mediaQueryList.dispatchEvent(event);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(() => {});
    }

    // Run the event handler after system preference change
    nextTick(() => {
      // It should still be system preference
      expect(preference.value).toBe('system');
      // But dark mode should now reflect the system preference
      expect(isDarkMode.value).toBe(true);
    });
  });
});
