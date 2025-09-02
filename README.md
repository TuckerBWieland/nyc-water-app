# NYC Water Quality Map

An interactive web application to visualize water quality data across various sampling sites in New York City.

## Features

- Interactive map showing water quality sampling sites
- Historical data navigation with a date scroller
- Detailed information for each sampling site
- **Welcome page with yearly statistics** - Shows total samples collected and unsafe counts
- **Real-time yearly data aggregation** - Automatically calculates statistics from all available datasets
- Seasonal history showing counts in each quality bucket
- Mobile-friendly responsive design with safe area support
- Light and dark theme support (defaults to dark)
- **Enhanced mobile experience** - Sticky CTA buttons and improved touch interactions
- **Progressive Web App features** - Mobile app capabilities with proper meta tags
- Evenly spaced info, data, and donate buttons for quick access
- **Improved popup styling** - Better dark mode support and responsive design

## Technology Stack

- Vue 3 (Composition API with TypeScript)
- TypeScript for type safety and better developer experience
- Leaflet for interactive maps
- Tailwind CSS for styling
- Vite for fast development and building

## Project Structure

```
public/           - Static assets and processed data
scripts/          - Data enrichment and utility scripts
  input/         - Folder for raw CSV files
src/              - Application source code
  components/    - Vue components for UI and map display
  composables/   - Reusable logic functions (including useYearlyStats)
  generated/     - Auto-generated files (latest-date.ts)
  pages/         - Route components including dynamic date pages
    welcome.vue  - New landing page with yearly statistics
    [date].vue   - Dynamic date-based map views
    index.vue    - Redirects to welcome page
    trends.vue   - Data trend analysis page
  services/      - External integrations (e.g., analytics)
  stores/        - Small reactive state modules
  types/         - TypeScript type definitions
tests/            - Jest unit tests
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production (includes type checking)
npm run build

# Build for production (skip type checking)
npm run build:fast

# Enrich data from CSV files
npm run enrich

# Preview production build
npm run preview
```

## Testing

Run the Jest unit tests with:

```bash
npm test
```

## Data Architecture

The application uses a static data approach for improved performance and reliability:

1. **Data Processing Pipeline**:

   - Place sample and rainfall CSV files in `scripts/input/`
     (this folder is included empty in the repository)
   - Run `npm run enrich` to convert the CSV files to GeoJSON and generate metadata
     with rainfall and tide information pulled from NOAA
   - Each dataset is stored in `public/data/<date>/` and the newest date is written to `latest.txt`
   - Processed CSV files are removed from `scripts/input/` once enrichment succeeds
   - If a dataset for a date already exists, running the enrich script will overwrite the previous data

2. **Data Files**:

   - **Source Data**: Raw CSV files in `scripts/input/`
   - **Processed Data**: `public/data/<date>/enriched.geojson` and `metadata.json`
   - **Latest Date**: `public/data/latest.txt` indicates the most recent dataset
   - **Available Dates**: `public/data/dates.json` lists all datasets in
     ascending order

3. **Runtime Data Flow**:
   - The latest dataset date is compiled into the app during the build
   - On load, the Vue router redirects to that newest date
   - Each date page fetches the corresponding `enriched.geojson` and `metadata.json`
   - All data is served as static files for fast loading

## Scripts

Key utilities live in the `scripts/` directory:

- `enrich-data.js` - Converts raw CSV files in `scripts/input/` to GeoJSON
  with rainfall totals and tide summaries. Updates `latest.txt` and `dates.json`.
- `tide-services.js` - Helper for retrieving NOAA tide predictions.
- `gen-latest.js` and `inject-latest.js` - Inject the most recent dataset date into the build.
- `copy-404.js` - Copies `index.html` to `404.html` for single-page app support on GitHub Pages.
- `cleanup-branches.js` - Interactive utility to delete merged remote branches safely.

## Deployment

The application is configured for deployment to GitHub Pages:

```bash
# Deploy to GitHub Pages
npm run deploy
```

The deploy script automatically copies `index.html` to `404.html` after building so that
dynamic routes like `/2025-05-08` work when hosted on GitHub Pages.

## Analytics

The application supports optional PostHog tracking. To enable analytics:

1. Copy `.env.example` to `.env` and provide your PostHog project key.

```bash
cp .env.example .env
echo "VITE_POSTHOG_KEY=YOUR_KEY" >> .env
# Optionally set VITE_POSTHOG_HOST if using a self-hosted instance
```

With `VITE_POSTHOG_KEY` set, basic page views will be recorded automatically.

## Recent Updates

The project has seen significant improvements:

### User Experience Enhancements
- **New Welcome Page**: Added a landing page (`welcome.vue`) with compelling yearly statistics display
- **Yearly Statistics Integration**: New `useYearlyStats` composable aggregates data across all available datasets
- **Enhanced Mobile Experience**: Improved touch interactions, sticky buttons with safe area support
- **Progressive Web App Features**: Added comprehensive meta tags for mobile app-like experience
- **Improved Popup Styling**: Better dark mode support and responsive design for map popups

### Technical Improvements
- **TypeScript Migration**: Full conversion from JavaScript to TypeScript for enhanced type safety, better IDE support, and improved maintainability
- **Centralized Type System**: All types now organized in `src/types/index.ts` for better maintainability
- Comprehensive type definitions for water quality data structures and component interfaces
- Updated build pipeline with TypeScript compilation and type checking
- Rainfall and water quality trend charts now include sticky axes and refined tick alignment
- Watcher callbacks in components are asynchronous to prevent rendering glitches
- JSDoc comments cover all chart utilities and composables
- Additional Jest tests verify map and popup behavior

### UI/UX Improvements
- **Enhanced CSS Architecture**: Improved z-index management and responsive styling
- **Better Dark Mode Support**: Consistent theming across all components including popups
- **Mobile-First Design**: Safe area support for modern mobile devices
- **Accessible Design**: Improved focus states and keyboard navigation

## TypeScript Features

The application now uses TypeScript throughout:

- **Type-safe data structures**: Complete typing for GeoJSON water quality data
- **Component interfaces**: Strongly typed props and emits for all Vue components
- **Composable return types**: Well-defined return types for all reusable logic
- **IDE support**: Enhanced IntelliSense, auto-completion, and refactoring capabilities
- **Build-time checks**: Catch potential runtime errors during development

### TypeScript Development

```bash
# Type check without emitting files
npm run type-check

# Build with full type checking (recommended)
npm run build

# Fast build without type checking (development only)
npm run build:fast
```

## New Welcome Page

The application now features a compelling welcome page that showcases the impact of the water quality monitoring program:

- **Dynamic Statistics**: Real-time aggregation of yearly sample counts and safety metrics
- **Compelling Messaging**: Large-format display highlighting the scale of data collection
- **Mobile-Optimized**: Responsive design with proper safe area handling
- **Direct Action**: Prominent call-to-action button to view the latest map data

### Welcome Page Features
- Loads and aggregates metadata from all available datasets
- Calculates total samples and unsafe sample counts across the year
- Provides context about water quality monitoring and its importance
- Seamlessly transitions users to the interactive map experience

