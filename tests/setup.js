// Mock import.meta for tests using a different approach
const mockImportMeta = {
  env: {
    MODE: 'test',
    VITE_POSTHOG_KEY: 'test-key'
  }
};

// Use babel transform to replace import.meta
if (typeof global !== 'undefined') {
  global.__importMeta = mockImportMeta;
}

// Mock the actual import.meta usage in specific files
jest.mock('../src/utils/basePath', () => ({
  basePath: ''
}));

jest.mock('../src/services/analytics', () => ({
  track: jest.fn(),
  EVENT_CLICK_SITE_MARKER: 'click_site_marker'
})); 