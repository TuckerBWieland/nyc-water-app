# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Development server: `npm run dev`
- Production build: `npm run build` (automatically runs enrichment before building)
- Preview build: `npm run preview`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Data enrichment: `npm run enrich-data` (enhances GeoJSON files with tide data)
- Deployment: `npm run deploy` (deploys to GitHub Pages)

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
- The `src/lib/analytics.js` provides structured tracking utilities:
  - All events use the `track(EVENTS.EVENT_NAME, properties)` pattern
  - Events follow verb_object[_context] naming in snake_case
  - Event documentation is maintained in `src/lib/eventMapping.json`

## Code Style Guidelines
- Vue 3 Composition API with `<script setup>` syntax
- Use ES modules with named imports
- Component names: PascalCase (e.g., MapViewer)
- Variable/function names: camelCase
- Indentation: 2 spaces
- Quotes: single quotes for JavaScript/Vue
- Vue components: single-file components (.vue)
- CSS: Use Tailwind utility classes; custom CSS in scoped style blocks
- Async: Use async/await for asynchronous operations
- State management: Vue refs and reactive objects
- Error handling: Try/catch blocks for async operations

## Key Components
- `MapViewer`: Main Leaflet map implementation with water quality indicators
- `DateScroller`: UI for selecting different sampling dates
- `HeaderOverlay`: Top information panel with site statistics
- `SampleBarLegend` & `RainDropLegend`: Visual indicators for water quality
- `InfoPopup`: Information modal for explaining the application

## Theme Support
- The application supports both light and dark themes
- Theme state is managed at the App.vue level and passed to components
- Map tiles and UI elements adapt to the current theme