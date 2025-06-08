# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Development server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Run tests: `npm run test`
- Data enrichment: `npm run enrich` (converts CSV samples to enriched GeoJSON)
- Deployment: `npm run predeploy && npm run deploy` (deploys to GitHub Pages)

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

### Tide Services

- NOAA tide data integration via `scripts/tide-services.js`
- Finds nearest tide stations to sampling locations
- Fetches and analyzes tide predictions around sampling times
- Provides tide state information (rising/falling, high/low/mid)

### Analytics

- Analytics are implemented using PostHog (`posthog-js`)
- The `src/services/analytics/index.js` provides tracking utilities:
  - Common events are defined as constants
  - All events use the `track(EVENT_NAME, properties)` pattern
  - Events follow verb_object[_context] naming in snake_case
  - Configuration is managed through environment variables

### Component Architecture

- Vue 3 Composition API with `<script setup>` syntax
- Composable functions for reusable logic in `src/composables/`:
  - `usePopupManager.js`: Manages popup states and visibility
  - `useStaticData.js`: Handles static data fetching and processing

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
- Error handling: Try/catch blocks with proper error logging
- JSDoc comments for all functions and components

## Key Components

- `MapViewer`: Main Leaflet map implementation with water quality indicators
- `DateScroller`: UI for selecting different sampling dates
- `DataInfoPopup`: Information popup for sample point details
- `DonatePopup`: Donation modal for supporting the project
- `InfoPopup`: Information modal for explaining the application
- `SampleBarLegend` & `RainDropLegend`: Visual indicators for water quality and rainfall

## Theme Support

- The application supports both light and dark themes
- Map tiles and UI elements adapt to the current theme

## Testing

- Jest testing framework for unit tests
- Tests are located in the `tests` directory
- Run tests with `npm run test`

## Contributor Notes

- Watcher callbacks should be written as async functions to avoid blocking the UI.
- Add JSDoc blocks for all new or modified functions.
- Execute `npm run test` before submitting changes.
