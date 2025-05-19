# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Development server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Data enrichment: `npm run enrich` (converts CSV samples to enriched GeoJSON)
- Deployment: `npm run deploy` (deploys to GitHub Pages)

## Architecture

### Data Flow
1. The app reads `public/data/latest.txt` to determine the most recent dataset
2. GeoJSON and metadata are loaded from `public/data/<date>/enriched.geojson` and `public/data/<date>/metadata.json`
3. The MapViewer component displays water quality samples as markers on a Leaflet map
4. Interactive components allow filtering and displaying details about sample points

### Data Enrichment
- CSV sample and rainfall files are combined into GeoJSON using `scripts/enrich-data.js`
- The enrichment process adds rainfall totals and basic metadata
- Run `npm run enrich` whenever new CSV files are added

### Analytics
- Analytics are implemented using PostHog (`posthog-js`)
- The `src/services/analytics/index.js` provides tracking utilities:
  - Common events are defined as constants
  - All events use the `track(EVENT_NAME, properties)` pattern
  - Events follow verb_object[_context] naming in snake_case
  - Configuration is managed through environment variables

### Error Handling
- Centralized error handling through `src/utils/errorHandler.js`
- Error severity levels: INFO, WARNING, ERROR, FATAL
- Context-aware error handling with optional reporting and user notification
- All async operations should use try/catch with the error handler

### Runtime Data Validation
- Utility functions for validating GeoJSON and other external data
- JSDoc comments document function parameters and return values
- Data validation happens at runtime to ensure data integrity

### Component Architecture
- Vue 3 Composition API with `<script>` and setup function
- Composable functions for reusable logic in `src/composables/`:
  - `useMap.js`: Leaflet map setup and management
  - `useDataFetching.js`: Data fetching with error handling
  - `useMarkers.js`: Map marker creation and management
  - `useTheme.js`: Theme state management (dark/light)
- Environment configuration via `src/config/index.js`

## Code Style Guidelines
- Vue 3 Composition API with standard JavaScript
- Use ES modules with named imports
- Component names: PascalCase (e.g., MapViewer)
- Variable/function names: camelCase
- Indentation: 2 spaces
- Quotes: single quotes for JavaScript/Vue
- Vue components: single-file components (.vue)
- CSS: Use Tailwind utility classes; custom CSS in scoped style blocks
- Async: Use async/await for asynchronous operations
- State management: Vue refs and reactive objects
- Error handling: Try/catch blocks with errorHandler utility
- JSDoc comments for all functions and components

## Key Components
- `MapViewer`: Main Leaflet map implementation with water quality indicators
- `DateScroller`: UI for selecting different sampling dates
- `HeaderOverlay`: Top information panel with site statistics
- `SampleBarLegend` & `RainDropLegend`: Visual indicators for water quality
- `InfoPopup`: Information modal for explaining the application

## Theme Support
- The application supports both light and dark themes
- Theme state is managed via the `useTheme` composable
- Map tiles and UI elements adapt to the current theme

