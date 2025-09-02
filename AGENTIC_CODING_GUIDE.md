# Agentic Coding Guide for NYC Water Quality Application

This document provides comprehensive guidance for AI coding agents working with this repository. Follow these instructions to understand the codebase deeply and make effective changes.

## 🎯 Core Philosophy: SIMPLE SOLUTIONS FIRST

**CRITICAL**: This codebase prioritizes simplicity and maintainability over complexity. Always choose the most straightforward approach that solves the problem effectively.

### Simplicity Principles
1. **Prefer built-in solutions** over custom implementations
2. **Use existing patterns** rather than inventing new ones
3. **Minimal abstractions** - only abstract when you have 3+ similar uses
4. **Direct approaches** - avoid over-engineering and unnecessary layers
5. **Clear, readable code** over clever optimizations
6. **Standard Vue 3 patterns** - stick to well-established practices

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
- `src/pages/welcome.vue` - New landing page with yearly statistics
- `src/pages/index.vue` - Redirects to welcome page
- `src/pages/[date].vue` - Dynamic date-based map views
- `src/composables/useYearlyStats.ts` - Yearly data aggregation logic
- `src/types/index.ts` - Centralized TypeScript type definitions
- `public/data/latest.txt` - Current dataset being displayed
- `vite.config.ts` - Build configuration (TypeScript)

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
- **useMapViewer.ts**: Map state and interactions with TypeScript
- **useStaticData.ts**: Data fetching and processing with type safety
- **usePopupManager.ts**: Popup state management
- **useScreenSize.ts**: Responsive design utilities
- **useYearlyStats.ts**: NEW - Aggregates yearly statistics across all datasets

#### `/src/pages/` - Route Components
- **welcome.vue**: New landing page with yearly statistics and impact messaging
- **index.vue**: Redirects to welcome page for better user onboarding
- **[date].vue**: Dynamic route for historical data views with enhanced mobile experience
- **trends.vue**: Data trend analysis page

#### `/src/stores/` - State Management
- **theme.js**: Global theme state (Pinia store)
- **featurePopupState.js**: Map feature interaction state

#### `/scripts/` - Data Processing
- **enrich-data.ts**: Main data processing pipeline (TypeScript)
- **tide-services.ts**: NOAA tide data integration
- **data-utils.ts**: Utility functions for data manipulation
- **gen-latest.ts**: Generates latest date TypeScript file for build-time inclusion
- **copy-404.ts**: Copies index.html to 404.html for GitHub Pages SPA support

#### `/src/types/` - TypeScript Definitions
- **index.ts**: Centralized type definitions for all data structures and component interfaces

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

#### 4. Yearly Statistics Aggregation Pattern
```typescript
// NEW: Pattern for aggregating data across multiple datasets
import { ref, computed, type Ref } from 'vue'
import type { DataMetadata } from '@/types'

export interface YearlyStats {
  totalSamples: number
  unsafeSamples: number
  safeSamples: number
  loading: boolean
  error: string | null
}

export function useYearlyStats() {
  const loading = ref<boolean>(true)
  const error = ref<string | null>(null)
  const allMetadata = ref<DataMetadata[]>([])

  // Computed property aggregates all data
  const stats = computed((): YearlyStats => {
    if (allMetadata.value.length === 0) {
      return {
        totalSamples: 0,
        unsafeSamples: 0,
        safeSamples: 0,
        loading: loading.value,
        error: error.value
      }
    }

    // Aggregate across all datasets
    const totalSamples = allMetadata.value.reduce((sum, metadata) => 
      sum + metadata.totalSites, 0)
    const unsafeSamples = allMetadata.value.reduce((sum, metadata) => 
      sum + metadata.cautionSites + metadata.poorSites, 0)
    
    return { totalSamples, unsafeSamples, ... }
  })

  const loadYearlyStats = async (): Promise<void> => {
    // Load and process all available datasets
    // This pattern handles multiple async operations with proper error handling
  }

  return { stats, loadYearlyStats }
}
```

#### 5. Progressive Web App Pattern
```typescript
// Enhanced meta tags for mobile app experience
// In index.html - comprehensive PWA setup
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#1f2937" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />

// In CSS - Safe area support for modern mobile devices
.fixed-bottom-button {
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

#### 6. Simple Theme Management Pattern
```typescript
// SIMPLE: Global reactive theme state - no store library needed
import { ref, watch } from 'vue'

export const isDarkMode = ref(true)

// Direct DOM manipulation - simple and effective
if (typeof document !== 'undefined') {
  document.body.classList.toggle('dark', isDarkMode.value)
}

// Watch for changes and update DOM directly
watch(isDarkMode, (val: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', val)
    document.body.classList.toggle('dark', val)
  }
})

export const toggleDarkMode = (): void => {
  isDarkMode.value = !isDarkMode.value
}
```

#### 7. Simple Routing Pattern
```typescript
// SIMPLE: Straightforward Vue Router setup
import { createRouter, createWebHistory } from 'vue-router'
import latestDate from './generated/latest-date.ts'

const router = createRouter({
  history: createWebHistory(basePath),
  routes: [
    { path: '/', component: WelcomePage },
    { path: '/map', redirect: `/${latestDate}` },
    { path: '/:date', component: DatePage },
    { path: '/trends', component: TrendsPage },
  ],
})

// Simple analytics tracking
router.afterEach(() => {
  track('$pageview')
})
```

#### 8. Simple Error Handling Pattern
```typescript
// SIMPLE: Consistent error handling across composables
const error = ref<string | null>(null)
const loading = ref<boolean>(false)

const fetchData = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    data.value = await response.json()
  } catch (err) {
    // Simple error message extraction
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}
```

#### 9. Simple Caching Pattern
```typescript
// SIMPLE: SessionStorage caching with graceful fallbacks
const cacheKey = `data-${identifier}`

try {
  const cached = sessionStorage?.getItem(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
} catch (err) {
  console.warn('Cache read failed:', err)
  // Continue without cache - no complex error handling needed
}

// After successful fetch
try {
  sessionStorage?.setItem(cacheKey, JSON.stringify(data))
} catch (err) {
  console.warn('Cache write failed:', err)
  // App continues working - cache is optional
}
```

#### 10. Simple Popup Management Pattern
```typescript
// SIMPLE: Global popup state - one popup open at a time
import { ref, computed } from 'vue'

const activePopup = ref<string | null>(null)
export const anyPopupOpen = computed(() => activePopup.value !== null)

export function usePopupManager(name: string) {
  const isOpen = computed({
    get: () => activePopup.value === name,
    set: (val: boolean) => {
      activePopup.value = val ? name : null
    }
  })

  const togglePopup = (): void => {
    isOpen.value = !isOpen.value
  }

  return { isOpen, togglePopup }
}

// Usage in component - simple and direct
const { isOpen, togglePopup } = usePopupManager('info-popup')
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

#### 2. Development Process (SIMPLE APPROACH)
1. **Understand the Change Request**: Read requirements carefully
2. **Find the simplest solution**: Look for existing patterns to reuse
3. **Identify Affected Components**: Use `grep` or `codebase_search` to find related code
4. **Check Dependencies**: Look for components that import/use what you're changing
5. **Choose the direct approach**: Avoid complex abstractions unless absolutely necessary
6. **Implement Incrementally**: Make small, testable changes
7. **Test Continuously**: Run tests after each significant change

**SIMPLICITY REMINDER**: Before implementing, ask:
- Is there already a pattern for this in the codebase?
- Can I solve this with built-in Vue/browser features?
- Am I over-engineering this solution?

#### 3. Testing Strategy
```bash
# Run specific test files during development
npm test -- DataInfoPopup.test.js

# Run tests in watch mode for active development
npm test -- --watch

# Full test suite before committing
npm run test
```

### Code Style Requirements (SIMPLE & CONSISTENT)

#### TypeScript Vue Components - SIMPLE PATTERN
```vue
<!-- SIMPLE: Follow this basic structure - don't over-complicate -->
<template>
  <!-- Use semantic HTML with Tailwind classes -->
  <main class="container mx-auto px-4">
    <!-- SIMPLE: Standard loading/error/content pattern -->
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else>
      <!-- Your content here -->
    </div>
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

## 🔧 Common Tasks & Approaches (SIMPLE SOLUTIONS FIRST)

### ⚠️ AVOID OVER-ENGINEERING

Before starting any task, ask yourself:
1. **Is there already a simple solution in the codebase?** → Use it
2. **Can I solve this with standard Vue/browser features?** → Do that
3. **Do I really need a new abstraction?** → Probably not
4. **Am I making this more complex than needed?** → Step back and simplify

### Task: Adding a New TypeScript Component (SIMPLE APPROACH)
1. **Look for similar components first** - reuse existing patterns
2. **Create Component File**: `src/components/NewComponent.vue` with `<script setup lang="ts">`
3. **Use the simplest structure** - follow existing component patterns
4. **Define minimal types** - only what you actually need
5. **Add types to `src/types/index.ts`** - only if reused elsewhere
6. **Import and use** - straightforward integration
7. **Write simple tests** - test behavior, not implementation
8. **Type check**: `npm run type-check`

**SIMPLE COMPONENT CHECKLIST**:
- [ ] Does it follow an existing pattern?
- [ ] Is the logic as simple as possible?
- [ ] Are you only abstracting what's actually reused?

### Task: Creating a New Landing Page (Welcome Page Pattern)
1. **Create Page Component**: `src/pages/new-page.vue` with TypeScript
2. **Create Data Composable**: If needed, create `src/composables/usePageData.ts`
3. **Define Data Interfaces**: Add types to `src/types/index.ts`
4. **Implement Responsive Design**: Use Tailwind with safe area support
5. **Add Progressive Web App Features**: Include proper meta tags and mobile optimization
6. **Test Mobile Experience**: Verify touch interactions and responsive behavior
7. **Add Route**: Update router configuration if needed
8. **Test Loading States**: Implement proper loading and error handling

### Task: Modifying Data Display (SIMPLE APPROACH)
1. **Find the existing pattern** - look at how similar data is displayed
2. **Understand Current Data Flow**: Trace from data source to display
3. **Use the simplest change** - modify existing logic rather than creating new abstractions
4. **Update Components**: Make minimal changes to achieve the goal
5. **Test with Real Data**: Use actual dataset for testing

**SIMPLE DATA DISPLAY CHECKLIST**:
- [ ] Am I reusing existing display patterns?
- [ ] Is this the minimal change needed?
- [ ] Am I avoiding unnecessary data transformations?

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

### Task: Mobile-First Design Implementation
1. **Safe Area Support**: Use `env(safe-area-inset-*)` for modern devices
2. **Touch-Friendly Interactions**: Ensure buttons are at least 44px touch targets
3. **Responsive Typography**: Use responsive text sizing (`text-lg md:text-xl`)
4. **Sticky Elements**: Position with safe area calculations
5. **Viewport Configuration**: Set proper viewport meta tags
6. **Test on Multiple Devices**: Verify experience across different screen sizes

Example Mobile-First CSS Pattern:
```css
/* Mobile-first responsive design */
.welcome-heading {
  @apply text-3xl leading-tight;
}

@media (min-width: 768px) {
  .welcome-heading {
    @apply text-5xl;
  }
}

@media (min-width: 1024px) {
  .welcome-heading {
    @apply text-7xl;
  }
}

/* Safe area support for sticky elements */
.sticky-cta {
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

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

### Before Starting Any Task (SIMPLICITY FIRST)
1. **Read the request completely** - understand the full scope
2. **Look for existing patterns** - find similar solutions already in the codebase
3. **Choose the simplest approach** - avoid over-engineering from the start
4. **Run type checker** - ensure current codebase is type-safe: `npm run type-check`
5. **Identify affected components** - use search tools to map dependencies
6. **Check existing tests** - understand current behavior
7. **Review type definitions** - check `src/types/index.ts` for relevant interfaces
8. **Consider mobile experience** - verify changes work on mobile devices
9. **Start with smallest changes** - iterate incrementally with type checking

**SIMPLICITY QUESTIONS** (ask these first):
- Is there already a pattern for this in the codebase?
- Can I solve this by modifying existing code instead of creating new abstractions?
- Am I choosing the most direct approach?

### During Development (KEEP IT SIMPLE)
1. **Stay focused on the simple solution** - resist the urge to over-engineer
2. **Type check continuously** - run `npm run type-check` after significant changes
3. **Test continuously** - run tests after each change
4. **Check the live app** - verify changes work in browser
5. **Follow established patterns** - use existing interfaces and approaches
6. **Maintain type safety** - avoid `any` types unless absolutely necessary
7. **Handle basics well** - loading states, errors, empty data
8. **Keep performance in mind** - but don't optimize prematurely

**DEVELOPMENT REMINDERS**:
- Am I still following the simplest approach?
- Have I introduced unnecessary complexity?
- Can I remove any abstractions I don't actually need?

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