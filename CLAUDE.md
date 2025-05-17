# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Development server: `npm run dev`
- Production build: `npm run build` (automatically runs enrichment before building)
- Preview build: `npm run preview`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Type check: `npm run typecheck`
- Data enrichment: `npm run enrich-data` (enhances GeoJSON files with tide data)
- Deployment: `npm run deploy` (deploys to GitHub Pages)

## Testing Commands
- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`
- Run tests with UI: `npm run test:ui`

## Architecture

### Data Flow
1. The app loads `public/data/index.json` to get available dates and the latest date
2. GeoJSON data is loaded from `public/data/[date].geojson` or `public/data/[date].enriched.geojson`
3. The MapViewer component displays water quality samples as markers on a Leaflet map
4. Interactive components allow filtering and displaying details about sample points

### Data Enrichment
- Raw GeoJSON files are enhanced with tide data from NOAA APIs
- The enrichment process adds tide information to each water sample point
- This happens automatically during the build process via the `prebuild` script

### Analytics
- Analytics are implemented using PostHog (`posthog-js`)
- The `src/services/analytics/index.ts` provides type-safe tracking utilities:
  - Events are defined in type definitions with payload mapping
  - All events use the `trackEvent(EVENT_NAME, properties)` pattern
  - Events follow verb_object[_context] naming in snake_case
  - Configuration is managed through environment variables

### Error Handling
- Centralized error handling through `src/utils/errorHandler.ts`
- Error severity levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Context-aware error handling with optional reporting and user notification
- All async operations should use try/catch with the error handler

### Type System
- TypeScript with strict mode enabled
- Type guards for runtime validation of external data
- Types are organized by domain in `src/types/`:
  - `geojson.ts`: GeoJSON data structures and type guards
  - `tide.ts`: Tide data structures and type guards
  - `rainfall.ts`: Rainfall data structures and type guards
  - `analytics.ts`: Type-safe analytics event definitions
  - `index.ts`: Re-exports of all types

### Component Architecture
- Vue 3 Composition API with `<script setup>` and TypeScript
- Composable functions for reusable logic in `src/composables/`:
  - `useMap.ts`: Leaflet map setup and management
  - `useDataFetching.ts`: Data fetching with error handling
  - `useMarkers.ts`: Map marker creation and management
  - `useTheme.ts`: Theme state management (dark/light)
- Environment configuration via `src/config/index.ts`

## Code Style Guidelines
- Vue 3 Composition API with `<script setup lang="ts">` syntax
- Use ES modules with named imports
- Component names: PascalCase (e.g., MapViewer)
- Variable/function names: camelCase
- Indentation: 2 spaces
- Quotes: single quotes for JavaScript/TypeScript/Vue
- Vue components: single-file components (.vue)
- CSS: Use Tailwind utility classes; custom CSS in scoped style blocks
- Async: Use async/await for asynchronous operations
- State management: Vue refs and reactive objects
- Error handling: Try/catch blocks with errorHandler utility
- JSDoc comments for all functions, interfaces, and components

## Key Components
- `MapViewer`: Main Leaflet map implementation with water quality indicators
- `DateScroller`: UI for selecting different sampling dates
- `HeaderOverlay`: Top information panel with site statistics
- `SampleBarLegend` & `RainDropLegend`: Visual indicators for water quality
- `InfoPopup`: Information modal for explaining the application
- `ErrorBoundary`: Error boundary component for graceful error handling

## Theme Support
- The application supports both light and dark themes
- Theme state is managed via the `useTheme` composable
- Map tiles and UI elements adapt to the current theme

## Testing Framework
- Vitest for unit, component, and integration testing
- Test files organized by type in the `tests/` directory
- Test coverage requirements: 80% for critical components
- Mocks for external dependencies in `tests/setup.ts`