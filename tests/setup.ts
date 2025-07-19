// Mock import.meta for tests using a different approach
interface MockImportMeta {
  env: {
    MODE: string
    VITE_POSTHOG_KEY: string
  }
}

const mockImportMeta: MockImportMeta = {
  env: {
    MODE: 'test',
    VITE_POSTHOG_KEY: 'test-key'
  }
}

// Use babel transform to replace import.meta
declare global {
  namespace NodeJS {
    interface Global {
      __importMeta: MockImportMeta
    }
  }
}

if (typeof global !== 'undefined') {
  (global as any).__importMeta = mockImportMeta
}

// Mock the actual import.meta usage in specific files
jest.mock('../src/utils/basePath', (): { basePath: string } => ({
  basePath: ''
}))

jest.mock('../src/services/analytics', (): { track: jest.MockedFunction<any>, EVENT_CLICK_SITE_MARKER: string } => ({
  track: jest.fn(),
  EVENT_CLICK_SITE_MARKER: 'click_site_marker'
}))

// Make this an external module to allow global augmentation
export {} 