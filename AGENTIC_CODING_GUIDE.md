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
- **Frontend**: Vue 3 + Composition API + Vite
- **Mapping**: Leaflet.js for interactive maps
- **Styling**: Tailwind CSS + custom CSS
- **Testing**: Jest + Vue Test Utils
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

#### 1. Composition API Pattern
```javascript
// ALWAYS use this pattern for new components
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useComposableName } from '@/composables/useComposableName'

// Reactive state
const isLoading = ref(false)
const data = ref(null)

// Composable usage
const { someUtility } = useComposableName()

// Computed properties
const processedData = computed(() => {
  return data.value ? processData(data.value) : []
})

// Lifecycle
onMounted(async () => {
  await loadData()
})
</script>
```

#### 2. Data Loading Pattern
```javascript
// Standard async data loading with error handling
const loadData = async () => {
  try {
    isLoading.value = true
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json()
  } catch (error) {
    console.error('Data loading failed:', error)
    // Always provide user feedback on errors
    errorMessage.value = 'Failed to load data. Please try again.'
  } finally {
    isLoading.value = false
  }
}
```

#### 3. Event Handling Pattern
```javascript
// Always use analytics tracking for user interactions
import { track, EVENTS } from '@/services/analytics'

const handleUserAction = (actionData) => {
  // Track the event
  track(EVENTS.USER_CLICKED_SAMPLE, { 
    sampleId: actionData.id,
    location: actionData.location 
  })
  
  // Execute the action
  performAction(actionData)
}
```

## 🛠️ Development Workflow

### Making Changes Safely

#### 1. Before Any Code Changes
```bash
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

#### Vue Components
```vue
<!-- ALWAYS follow this structure -->
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

<script setup>
// Imports at top
import { ref, computed, onMounted } from 'vue'
import ComponentName from '@/components/ComponentName.vue'

// Props definition
const props = defineProps({
  dataSource: {
    type: String,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

// Emits definition
const emit = defineEmits(['update', 'error'])

// Reactive state
const isLoading = ref(false)
const error = ref(null)

// Computed properties
const processedData = computed(() => {
  // Process data logic
})

// Methods
const handleAction = async () => {
  // Method implementation
}

// Lifecycle hooks
onMounted(() => {
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

#### JavaScript Functions
```javascript
/**
 * Always include JSDoc comments for functions
 * @param {Object} params - Parameter description
 * @param {string} params.id - Specific parameter details
 * @returns {Promise<Object>} Return value description
 */
export const processData = async ({ id, options = {} }) => {
  try {
    // Implementation
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

#### 3. Data Structure
```javascript
// enriched.geojson structure
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "sampleId": "unique_identifier",
        "collectionDate": "ISO_date_string",
        "enterococcus": number,
        "rainfall": number,
        "tideState": "rising|falling|high|low|mid",
        "location": "descriptive_name"
      }
    }
  ]
}
```

### Working with Data

#### Loading Data in Components
```javascript
import { useStaticData } from '@/composables/useStaticData'

// In component setup
const { loadDateData, currentData, isLoading, error } = useStaticData()

// Load specific date data
await loadDateData('2025-05-15')

// Access the loaded data
const samples = currentData.value?.features || []
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

#### Adding New Map Features
```javascript
// Pattern for adding new map functionality
import L from 'leaflet'

// In the map setup
const addCustomLayer = (map, data) => {
  const layer = L.geoJSON(data, {
    // Styling function
    style: (feature) => ({
      color: getColorForFeature(feature),
      weight: 2,
      opacity: 0.8
    }),
    
    // Popup binding
    onEachFeature: (feature, layer) => {
      layer.bindPopup(createPopupContent(feature))
    }
  })
  
  layer.addTo(map)
  return layer
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

### Writing Effective Tests
```javascript
// Component testing pattern
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import ComponentName from '@/components/ComponentName.vue'

describe('ComponentName', () => {
  let wrapper
  
  beforeEach(() => {
    wrapper = mount(ComponentName, {
      props: {
        requiredProp: 'test-value'
      }
    })
  })
  
  it('should render correctly with props', () => {
    expect(wrapper.find('.expected-element').exists()).toBe(true)
  })
  
  it('should handle user interactions', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('expected-event')).toBeTruthy()
  })
})
```

### Test Data Management
- **Mock Data**: Use consistent mock data across tests
- **API Mocking**: Mock external API calls in `__mocks__/` directory
- **Async Testing**: Always use `await` for async operations

## 🔧 Common Tasks & Approaches

### Task: Adding a New Component
1. **Create Component File**: `src/components/NewComponent.vue`
2. **Follow Template Structure**: Use the Vue component template above
3. **Add Props/Emits**: Define clear interfaces
4. **Import and Use**: Add to parent components
5. **Write Tests**: Create `tests/NewComponent.test.js`
6. **Update Documentation**: Add to this guide if it's a major component

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
- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Local preview works: `npm run preview`
- [ ] No console errors in production build
- [ ] Analytics events work correctly
- [ ] All data loads correctly
- [ ] Mobile responsiveness verified

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
1. Check for TypeScript errors (if applicable)
2. Verify all imports are correct
3. Check for missing dependencies
4. Clear node_modules and reinstall

### Debugging Tools
```javascript
// Add debugging to components
import { ref, watch } from 'vue'

const debugMode = ref(process.env.NODE_ENV === 'development')

// Watch for data changes
watch(someData, (newValue, oldValue) => {
  if (debugMode.value) {
    console.log('Data changed:', { newValue, oldValue })
  }
}, { deep: true })
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
2. **Identify affected components** - use search tools to map dependencies
3. **Check existing tests** - understand current behavior
4. **Plan your approach** - consider multiple solutions
5. **Start with smallest changes** - iterate incrementally

### During Development
1. **Test continuously** - run tests after each change
2. **Check the live app** - verify changes work in browser
3. **Follow established patterns** - don't reinvent existing solutions
4. **Consider edge cases** - handle loading states, errors, empty data
5. **Think about performance** - especially for map and data operations

### Before Completing
1. **Run full test suite** - ensure nothing broke
2. **Test with real data** - use actual datasets
3. **Check all user flows** - verify complete functionality
4. **Review code quality** - ensure it meets standards
5. **Update documentation** - if you added new patterns or components

## 📚 Additional Resources

### Key Dependencies Documentation
- **Vue 3**: https://vuejs.org/guide/
- **Leaflet**: https://leafletjs.com/reference.html
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/
- **Jest**: https://jestjs.io/docs/getting-started

### Project-Specific Resources
- **NOAA Tide API**: Used in `scripts/tide-services.js`
- **PostHog Analytics**: Configuration in `src/services/analytics/`
- **GitHub Pages**: Deployment target for the application

---

**Remember**: This is a **public-facing application** that helps New Yorkers understand water quality. Every change should prioritize **user experience**, **data accuracy**, and **accessibility**. When in doubt, err on the side of caution and test thoroughly. 