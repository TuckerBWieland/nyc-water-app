# Agentic Coding Guide for NYC Water Quality Application

This document provides comprehensive guidance for AI coding agents working with this repository. Follow these instructions to understand the codebase deeply and make effective changes.

## 🚀 Critical First Steps for Any Agent

### 1. Repository Understanding (ALWAYS DO THIS FIRST)
```bash
# Understand what you're working with
npm run dev      # Start development server to see the live app
npm run test     # Run existing tests to ensure baseline functionality
```

**Essential Files to Review:**
- `package.json` - Dependencies and available scripts
- `src/App.vue` - Main application entry point
- `src/pages/index.vue` - Homepage component
- `public/data/latest.txt` - Current dataset being displayed
- `vite.config.js` - Build configuration

### 2. Data Flow Comprehension
This is a **data-driven mapping application**. Always understand:
- **Data Source**: `public/data/<date>/enriched.geojson` contains water quality samples
- **Data Processing**: `scripts/enrich-data.js` converts raw CSV to enriched GeoJSON
- **Data Display**: `MapViewer.vue` renders samples as interactive map markers
- **Data Updates**: New datasets are added weekly in `public/data/<date>/` folders

### 3. Live Environment Setup
```bash
# Always verify the app runs before making changes
npm install
npm run dev
# Visit http://localhost:5173 to see the live application
```

## 🏗️ Architecture Deep Dive

### Core Technology Stack
- **Frontend**: Vue 3 + Composition API + TypeScript + Vite
- **Type System**: TypeScript for enhanced type safety and developer experience
- **Mapping**: Leaflet.js for interactive maps
- **Styling**: Tailwind CSS + custom CSS
- **Testing**: Jest + Vue Test Utils + TypeScript support
- **Analytics**: PostHog for user behavior tracking
- **Deployment**: GitHub Pages with automated workflows

### Directory Structure & Responsibilities

#### `/src/components/` - UI Components
- **MapViewer.vue**: Primary map component (Leaflet integration)
- **DateScroller.vue**: Date navigation for historical data
- **DataInfoPopup.vue**: Sample point detail overlay
- **PopupContainer.vue**: Base popup functionality
- **ThemeToggleButton.vue**: Light/dark mode switching
- **Legend components**: Visual indicators for data interpretation

#### `/src/composables/` - Reusable Logic
- **useMapViewer.js**: Map state and interactions
- **useStaticData.js**: Data fetching and processing
- **usePopupManager.js**: Popup state management
- **useScreenSize.js**: Responsive design utilities

#### `/src/pages/` - Route Components
- **index.vue**: Homepage with latest data
- **[date].vue**: Dynamic route for historical data views
- **trends.vue**: Data trend analysis page

#### `/src/stores/` - State Management
- **theme.js**: Global theme state (Pinia store)
- **featurePopupState.js**: Map feature interaction state

#### `/scripts/` - Data Processing
- **enrich-data.js**: Main data processing pipeline
- **tide-services.js**: NOAA tide data integration
- **data-utils.js**: Utility functions for data manipulation

### Key Design Patterns

#### 1. TypeScript Composition API Pattern
```typescript
// ALWAYS use this pattern for new components
<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue'
import type { WaterQualityGeoJSON } from '@/types'
import { useComposableName } from '@/composables/useComposableName'

// Typed reactive state
const isLoading = ref<boolean>(false)
const data = ref<WaterQualityGeoJSON | null>(null)

// Composable usage (with proper typing)
const { someUtility } = useComposableName()

// Computed properties with inferred types
const processedData = computed<ProcessedData[]>(() => {
  return data.value ? processData(data.value) : []
})

// Lifecycle with proper async typing
onMounted(async (): Promise<void> => {
  await loadData()
})
</script>
```

#### 2. TypeScript Data Loading Pattern
```typescript
// Standard async data loading with error handling and type safety
const loadData = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    // Type-safe JSON parsing
    const result: WaterQualityGeoJSON = await response.json()
    data.value = result
  } catch (error) {
    console.error('Data loading failed:', error)
    // Type-safe error handling
    errorMessage.value = error instanceof Error ? 
      error.message : 'Failed to load data. Please try again.'
  } finally {
    isLoading.value = false
  }
}
```

#### 3. TypeScript Event Handling Pattern
```typescript
// Always use analytics tracking for user interactions with proper typing
import { track, EVENT_CLICK_SITE_MARKER } from '@/services/analytics'
import type { WaterQualityFeature } from '@/types'

interface ActionData {
  id: string
  location: string
  feature: WaterQualityFeature
}

const handleUserAction = (actionData: ActionData): void => {
  // Type-safe event tracking
  track(EVENT_CLICK_SITE_MARKER, { 
    sampleId: actionData.id,
    location: actionData.location,
    siteName: actionData.feature.properties.siteName
  })
  
  // Execute the action
  performAction(actionData)
}
```

## 🛠️ Development Workflow

### Making Changes Safely

#### 1. Before Any Code Changes
```bash
# Ensure TypeScript compiles without errors
npm run type-check

# Ensure tests pass
npm run test

# Verify current functionality
npm run dev
# Manually test the features you'll be modifying
```

#### 2. Development Process
1. **Understand the Change Request**: Read requirements carefully
2. **Identify Affected Components**: Use `grep` or `codebase_search` to find related code
3. **Check Dependencies**: Look for components that import/use what you're changing
4. **Plan Your Approach**: Consider backward compatibility and data flow
5. **Implement Incrementally**: Make small, testable changes
6. **Test Continuously**: Run tests after each significant change

#### 3. Testing Strategy
```bash
# Run specific test files during development
npm test -- DataInfoPopup.test.js

# Run tests in watch mode for active development
npm test -- --watch

# Full test suite before committing
npm run test
```

### Code Style Requirements

#### TypeScript Vue Components
```vue
<!-- ALWAYS follow this structure with TypeScript -->
<template>
  <!-- Use semantic HTML -->
  <main class="container mx-auto px-4">
    <!-- Tailwind classes preferred over custom CSS -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Conditional rendering with v-if/v-show -->
      <div v-if="isLoading" class="loading-spinner">Loading...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else>{{ content }}</div>
    </section>
  </main>
</template>

<script setup lang="ts">
// Imports at top with type imports
import { ref, computed, onMounted, type Ref } from 'vue'
import type { WaterQualityGeoJSON } from '@/types'
import ComponentName from '@/components/ComponentName.vue'

// TypeScript interface for props
interface Props {
  dataSource: string
  options?: Record<string, any>
}

// Props definition with defaults
const props = withDefaults(defineProps<Props>(), {
  options: () => ({})
})

// Typed emits definition
interface Emits {
  update: [data: WaterQualityGeoJSON]
  error: [message: string]
}

const emit = defineEmits<Emits>()

// Typed reactive state
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)

// Computed properties with explicit types when needed
const processedData = computed<ProcessedData[]>(() => {
  // Process data logic with type safety
  return processDataSafely(props.dataSource)
})

// Typed methods
const handleAction = async (): Promise<void> => {
  // Method implementation with proper error handling
  try {
    const result = await performAction()
    emit('update', result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    emit('error', message)
  }
}

// Lifecycle hooks
onMounted((): void => {
  // Initialization logic
})
</script>

<style scoped>
/* Only use custom CSS when Tailwind isn't sufficient */
.custom-element {
  /* Custom styles */
}
</style>
```

#### TypeScript Functions
```typescript
/**
 * TypeScript functions with comprehensive typing and JSDoc
 * @param params - Parameter description with TypeScript interface
 * @returns Promise resolving to processed data
 */
interface ProcessDataParams {
  id: string
  options?: Record<string, any>
}

interface ProcessDataResult {
  data: WaterQualityGeoJSON
  metadata: DataMetadata
}

export const processData = async ({ 
  id, 
  options = {} 
}: ProcessDataParams): Promise<ProcessDataResult> => {
  try {
    // Implementation with type safety
    const result: ProcessDataResult = await performProcessing(id, options)
    return result
  } catch (error) {
    console.error('processData failed:', error)
    throw error // Re-throw for caller to handle
  }
}
```

## 📊 Data Management

### Understanding the Data Pipeline

#### 1. Raw Data Input
- **Location**: `scripts/input/` directory
- **Format**: CSV files with water quality samples
- **Structure**: Each row represents a water sample with coordinates and measurements

#### 2. Data Enrichment Process
```bash
# Run this when new CSV data is available
npm run enrich
```

**What enrichment does:**
- Converts CSV to GeoJSON format
- Adds rainfall data correlation
- Includes tide information from NOAA
- Generates metadata.json with summary statistics
- Creates date-specific directories in `public/data/`

#### 3. TypeScript Data Structure
```typescript
// Type-safe enriched.geojson structure
interface WaterQualityGeoJSON {
  type: 'FeatureCollection'
  features: WaterQualityFeature[]
}

interface WaterQualityFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: WaterQualityFeatureProperties
}

interface WaterQualityFeatureProperties {
  siteName: string
  mpn: number | null
  timestamp?: string
  tide?: string
  rainfall_mm_7day?: number | null
  rainByDay?: (number | null)[]
  goodCount?: number
  cautionCount?: number
  poorCount?: number
}

// Example usage with full type safety
const sampleData: WaterQualityGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      properties: {
        siteName: "Hudson River Sample Site",
        mpn: 45,
        timestamp: "2025-05-15T10:30:00Z",
        tide: "rising",
        rainfall_mm_7day: 12.5
      }
    }
  ]
}
```

### Working with Data

#### Loading Data in Components (TypeScript)
```typescript
import { useStaticData } from '@/composables/useStaticData'
import type { WaterQualityFeature } from '@/types'

// In component setup with proper typing
const { data, metadata, loading, error, load } = useStaticData('2025-05-15')

// Load specific date data
await load('2025-05-15')

// Access the loaded data with type safety
const samples: WaterQualityFeature[] = data.value?.features || []

// Type-safe property access
samples.forEach((sample: WaterQualityFeature) => {
  const siteName: string = sample.properties.siteName
  const mpnValue: number | null = sample.properties.mpn
})
```

#### Adding New Data Fields
1. **Modify Enrichment Script**: Update `scripts/enrich-data.js`
2. **Update Type Definitions**: Add to TypeScript interfaces if used
3. **Update Display Components**: Modify components that show data
4. **Update Tests**: Ensure test data includes new fields

## 🗺️ Map Integration

### Leaflet Map Management

#### Understanding MapViewer.vue
This is the core component - understand it thoroughly:
- **Map Initialization**: Creates Leaflet map instance
- **Layer Management**: Handles tile layers for light/dark themes
- **Marker Creation**: Converts GeoJSON features to map markers
- **Interaction Handling**: Click events, popups, zoom controls

#### Adding New Map Features (TypeScript)
```typescript
// Pattern for adding new map functionality with TypeScript
import L from 'leaflet'
import type { WaterQualityGeoJSON, WaterQualityFeature } from '@/types'

// In the map setup with proper typing
const addCustomLayer = (
  map: L.Map, 
  data: WaterQualityGeoJSON
): L.GeoJSON => {
  const layer = L.geoJSON(data, {
    // Styling function with typed parameters
    style: (feature?: WaterQualityFeature): L.PathOptions => ({
      color: getColorForFeature(feature),
      weight: 2,
      opacity: 0.8
    }),
    
    // Popup binding with type safety
    onEachFeature: (feature: WaterQualityFeature, layer: L.Layer): void => {
      if (layer instanceof L.Marker || layer instanceof L.Path) {
        layer.bindPopup(createPopupContent(feature))
      }
    }
  })
  
  layer.addTo(map)
  return layer
}

// Type-safe color function
const getColorForFeature = (feature?: WaterQualityFeature): string => {
  if (!feature?.properties.mpn) return '#gray'
  const mpn = feature.properties.mpn
  if (mpn < 35) return '#green'
  if (mpn <= 104) return '#yellow'
  return '#red'
}
```

#### Map Performance Considerations
- **Large Datasets**: Use marker clustering for >1000 points
- **Layer Management**: Remove old layers before adding new ones
- **Memory Leaks**: Always clean up event listeners on component unmount

## 🧪 Testing Strategy

### Test File Organization
- **Component Tests**: Test user interactions and rendering
- **Composable Tests**: Test reusable logic functions
- **Utility Tests**: Test data processing functions

### Writing Effective TypeScript Tests
```typescript
// Component testing pattern with TypeScript
import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import ComponentName from '@/components/ComponentName.vue'
import type { ComponentProps } from '@/types'

// Type the component wrapper
type ComponentWrapper = VueWrapper<InstanceType<typeof ComponentName>>

describe('ComponentName', () => {
  let wrapper: ComponentWrapper
  
  beforeEach(() => {
    const props: ComponentProps = {
      requiredProp: 'test-value',
      optionalProp: { data: 'test' }
    }
    
    wrapper = mount(ComponentName, { props })
  })
  
  it('should render correctly with props', () => {
    expect(wrapper.find('.expected-element').exists()).toBe(true)
  })
  
  it('should handle user interactions', async (): Promise<void> => {
    await wrapper.find('button').trigger('click')
    
    // Type-safe event checking
    const emittedEvents = wrapper.emitted('expected-event')
    expect(emittedEvents).toBeTruthy()
    
    // Type-safe payload checking
    if (emittedEvents) {
      const [eventPayload] = emittedEvents[0]
      expect(eventPayload).toMatchObject({ expected: 'data' })
    }
  })
})
```

### Test Data Management
- **Mock Data**: Use consistent mock data across tests
- **API Mocking**: Mock external API calls in `__mocks__/` directory
- **Async Testing**: Always use `await` for async operations

## 🔧 Common Tasks & Approaches

### Task: Adding a New TypeScript Component
1. **Create Component File**: `src/components/NewComponent.vue` with `<script setup lang="ts">`
2. **Follow Template Structure**: Use the TypeScript Vue component template above
3. **Define Types**: Create interfaces for props, emits, and internal data structures
4. **Add Type Definitions**: Update `src/types/index.ts` if introducing new data types
5. **Import and Use**: Add to parent components with proper typing
6. **Write Tests**: Create `tests/NewComponent.test.ts` with TypeScript
7. **Type Check**: Run `npm run type-check` to verify type safety
8. **Update Documentation**: Add to this guide if it's a major component

### Task: Modifying Data Display
1. **Understand Current Data Flow**: Trace from data source to display
2. **Identify Display Logic**: Find where rendering decisions are made
3. **Update Processing**: Modify data transformation if needed
4. **Update Components**: Change display components
5. **Test with Real Data**: Use actual dataset for testing

### Task: Adding New Analytics Events
1. **Define Event**: Add to `src/services/analytics/index.js`
2. **Follow Naming Convention**: `verb_object_context` (snake_case)
3. **Add Tracking**: Use `track(EVENT_NAME, properties)` pattern
4. **Test Tracking**: Verify events are sent correctly
5. **Document**: Update analytics documentation

### Task: Performance Optimization
1. **Identify Bottleneck**: Use browser dev tools to profile
2. **Common Issues**:
   - Large dataset rendering
   - Unnecessary re-renders
   - Memory leaks in map components
   - Unoptimized API calls
3. **Solutions**:
   - Implement virtual scrolling for large lists
   - Use `computed` properties for expensive calculations
   - Debounce user inputs
   - Lazy load non-critical components

## 🚀 Deployment & Release

### GitHub Pages Deployment
```bash
# Production deployment
npm run predeploy && npm run deploy
```

**What happens:**
1. `predeploy`: Runs build and copies 404.html
2. `deploy`: Pushes built files to `gh-pages` branch
3. GitHub Pages serves the application

### Pre-deployment Checklist
- [ ] TypeScript compiles without errors: `npm run type-check`
- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Local preview works: `npm run preview`
- [ ] No console errors in production build
- [ ] Analytics events work correctly
- [ ] All data loads correctly
- [ ] Mobile responsiveness verified
- [ ] Type definitions are complete and accurate

## 🐛 Debugging & Troubleshooting

### Common Issues

#### Map Not Loading
1. Check browser console for Leaflet errors
2. Verify data is loading: Check Network tab
3. Check map container has height: CSS issue
4. Verify tile layer URLs are accessible

#### Data Not Displaying
1. Check `public/data/latest.txt` exists
2. Verify GeoJSON format is valid
3. Check for CORS issues with data files
4. Verify date format matches expected pattern

#### Build Failures
1. **Check TypeScript errors first**: `npm run type-check`
2. Verify all imports are correct and properly typed
3. Check for missing dependencies and their type definitions
4. Ensure all `.vue` files have `lang="ts"` in script tags if using TypeScript
5. Clear node_modules and reinstall if type errors persist

### TypeScript Debugging Tools
```typescript
// Add debugging to components with TypeScript
import { ref, watch, type Ref } from 'vue'
import type { WaterQualityGeoJSON } from '@/types'

const debugMode: Ref<boolean> = ref(process.env.NODE_ENV === 'development')

// Type-safe watching for data changes
watch<WaterQualityGeoJSON | null>(
  someData, 
  (newValue: WaterQualityGeoJSON | null, oldValue: WaterQualityGeoJSON | null) => {
    if (debugMode.value) {
      console.log('Data changed:', { 
        newFeatureCount: newValue?.features.length || 0,
        oldFeatureCount: oldValue?.features.length || 0,
        newValue, 
        oldValue 
      })
    }
  }, 
  { deep: true }
)

// Type-safe development utilities
interface DebugInfo {
  componentName: string
  timestamp: string
  data: any
}

const logDebugInfo = (info: DebugInfo): void => {
  if (debugMode.value) {
    console.group(`🐛 ${info.componentName} Debug`)
    console.log('Timestamp:', info.timestamp)
    console.log('Data:', info.data)
    console.groupEnd()
  }
}
```

## 📈 Performance Guidelines

### Component Performance
- **Use `v-memo`** for expensive list rendering
- **Implement `computed`** for derived state
- **Avoid reactive objects** for large datasets
- **Use `shallowRef`** for complex objects that don't need deep reactivity

### Map Performance
- **Limit simultaneous markers** (<1000 visible)
- **Use clustering** for large datasets
- **Implement viewport-based rendering**
- **Clean up layers** when switching data

### Data Loading Performance
- **Cache frequently accessed data**
- **Implement progressive loading** for large datasets
- **Use service workers** for offline functionality
- **Optimize bundle size** with tree shaking

## 🔐 Security Considerations

### Data Handling
- **Validate all external data** before processing
- **Sanitize user inputs** if any exist
- **Use HTTPS** for all external API calls
- **Handle errors gracefully** without exposing internal details

### Analytics Privacy
- **Anonymize user data** in analytics
- **Respect Do Not Track** headers
- **Provide opt-out mechanisms**
- **Follow GDPR guidelines** for EU users

## 📝 Documentation Standards

### Code Comments
```javascript
/**
 * Process water quality data and enrich with additional information
 * @param {Object} rawData - Raw CSV data from sampling
 * @param {Object} options - Processing options
 * @param {boolean} options.includeTides - Whether to fetch tide data
 * @param {boolean} options.includeRainfall - Whether to include rainfall data
 * @returns {Promise<Object>} Enriched GeoJSON data
 * @throws {Error} When data processing fails
 */
```

### Component Documentation
- **Props**: Document all props with types and descriptions
- **Events**: Document all emitted events
- **Slots**: Document available slots and their purpose
- **Examples**: Provide usage examples in comments

## 🎯 Agent Success Patterns

### Before Starting Any Task
1. **Read the request completely** - understand the full scope
2. **Run type checker** - ensure current codebase is type-safe: `npm run type-check`
3. **Identify affected components** - use search tools to map dependencies
4. **Check existing tests** - understand current behavior
5. **Review type definitions** - check `src/types/index.ts` for relevant interfaces
6. **Plan your approach** - consider type safety and multiple solutions
7. **Start with smallest changes** - iterate incrementally with type checking

### During Development
1. **Type check continuously** - run `npm run type-check` after significant changes
2. **Test continuously** - run tests after each change
3. **Check the live app** - verify changes work in browser
4. **Follow established TypeScript patterns** - use existing interfaces and types
5. **Maintain type safety** - avoid `any` types unless absolutely necessary
6. **Consider edge cases** - handle loading states, errors, empty data with proper typing
7. **Think about performance** - especially for map and data operations

### Before Completing
1. **Run TypeScript type checking** - `npm run type-check` must pass
2. **Run full test suite** - ensure nothing broke
3. **Test with real data** - use actual datasets
4. **Check all user flows** - verify complete functionality
5. **Review code quality** - ensure it meets TypeScript standards
6. **Verify type definitions** - ensure all new types are properly exported from `src/types/`
7. **Update documentation** - if you added new patterns, components, or types

## 🔧 TypeScript Best Practices

### Type Definition Organization

The application uses a centralized type system in `src/types/index.ts`. When adding new types:

#### 1. Data Types
```typescript
// Always export interfaces for external data structures
export interface NewDataType {
  id: string
  name: string
  value: number | null
  metadata?: Record<string, any>
}

// Use union types for known string values
export type StatusType = 'pending' | 'loading' | 'success' | 'error'

// Create mapped types for transformations
export type PartialData<T> = {
  [K in keyof T]?: T[K]
}
```

#### 2. Component Types
```typescript
// Define props interfaces with optional properties
export interface ComponentProps {
  requiredProp: string
  optionalProp?: number
  callbackProp?: (data: SomeType) => void
}

// Define event payload interfaces
export interface ComponentEvents {
  update: [data: UpdatedData]
  error: [message: string, code?: number]
  close: []
}
```

#### 3. Composable Types
```typescript
// Define return types for composables
export interface UseDataReturn {
  data: Ref<DataType | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
}

// Use generic types for reusable composables
export interface UseAsyncReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  execute: (...args: any[]) => Promise<T>
}
```

### Type Safety Guidelines

#### 1. Strict Type Checking
- **Never use `any`** unless interfacing with untyped external libraries
- **Use `unknown`** instead of `any` when type is truly unknown
- **Prefer union types** over broad types like `object` or `Record<string, any>`

#### 2. Null Safety
```typescript
// Always handle null/undefined explicitly
const processData = (data: DataType | null): ProcessedData[] => {
  if (!data) return []
  return data.items.map(transformItem)
}

// Use optional chaining for nested properties
const siteName = feature?.properties?.siteName ?? 'Unknown Site'

// Use nullish coalescing for default values
const displayValue = value ?? 'N/A'
```

#### 3. Generic Constraints
```typescript
// Use constraints to limit generic types
interface ApiResponse<T extends Record<string, any>> {
  data: T
  status: number
  message: string
}

// Constrain function parameters
function processItems<T extends { id: string }>(items: T[]): T[] {
  return items.filter(item => item.id.length > 0)
}
```

### Working with Vue 3 TypeScript

#### 1. Component Props
```typescript
// Use defineProps with TypeScript interface
interface Props {
  items: Item[]
  selectedId?: string
  onSelect?: (id: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: undefined,
  onSelect: undefined
})
```

#### 2. Template Refs
```typescript
// Type template refs properly
const mapContainer = ref<HTMLDivElement | null>(null)
const inputElement = ref<HTMLInputElement | null>(null)

// Use type assertion only when necessary
const specificElement = ref<HTMLElement>(null as any)
```

#### 3. Computed Properties
```typescript
// Explicitly type complex computed properties
const filteredItems = computed<FilteredItem[]>(() => {
  return items.value
    .filter(item => item.isVisible)
    .map(item => transformToFiltered(item))
})
```

### Error Handling Patterns

#### 1. Type-Safe Error Handling
```typescript
// Create error union types
type ApiError = {
  type: 'network'
  message: string
} | {
  type: 'validation'
  field: string
  message: string
} | {
  type: 'unknown'
  error: unknown
}

// Handle errors with type guards
const handleError = (error: ApiError): void => {
  switch (error.type) {
    case 'network':
      showNetworkError(error.message)
      break
    case 'validation':
      highlightField(error.field, error.message)
      break
    case 'unknown':
      console.error('Unknown error:', error.error)
      break
  }
}
```

#### 2. Result Types
```typescript
// Use Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

const fetchData = async (): Promise<Result<DataType>> => {
  try {
    const data = await api.getData()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
```

### Performance Considerations

#### 1. Type Imports
```typescript
// Use type-only imports when possible
import type { LargeInterface } from './types'
import { someFunction } from './utils'

// This reduces bundle size as types are erased at runtime
```

#### 2. Interface vs Type Aliases
```typescript
// Use interfaces for object shapes (can be extended)
interface User {
  id: string
  name: string
}

interface AdminUser extends User {
  permissions: string[]
}

// Use type aliases for unions, primitives, computed types
type Status = 'idle' | 'loading' | 'error'
type UserKeys = keyof User
```

## 📚 Additional Resources

### Key Dependencies Documentation
- **Vue 3**: https://vuejs.org/guide/
- **Vue 3 TypeScript**: https://vuejs.org/guide/typescript/overview.html
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Leaflet**: https://leafletjs.com/reference.html
- **Leaflet Types**: https://www.npmjs.com/package/@types/leaflet
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/
- **Jest**: https://jestjs.io/docs/getting-started

### Project-Specific Resources
- **NOAA Tide API**: Used in `scripts/tide-services.js`
- **PostHog Analytics**: Configuration in `src/services/analytics/`
- **GitHub Pages**: Deployment target for the application

---

**Remember**: This is a **public-facing application** that helps New Yorkers understand water quality. Every change should prioritize **user experience**, **data accuracy**, and **accessibility**. When in doubt, err on the side of caution and test thoroughly. 