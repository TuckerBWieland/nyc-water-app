# NYC Water Quality Map

An interactive web application to visualize water quality data across various sampling sites in New York City.

## Features

- Interactive map showing water quality sampling sites
- Historical data navigation with a date scroller
- Detailed information for each sampling site
- Mobile-friendly responsive design
- Light and dark theme support (defaults to dark)

## Technology Stack

- Vue 3 (Composition API with JavaScript)
- Leaflet for interactive maps
- Tailwind CSS for styling
- Vite for fast development and building

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Enrich data from CSV files
npm run enrich

# Preview production build
npm run preview
```

## Data Architecture

The application uses a static data approach for improved performance and reliability:

1. **Data Processing Pipeline**:
   - Place sample and rainfall CSV files in `scripts/input/`
   - Run `npm run enrich` to convert the CSV files to GeoJSON and generate metadata
     with rainfall and tide information pulled from NOAA
    - Each dataset is stored in `public/data/<date>/` and the newest date is written to `latest.txt`
    - Processed CSV files are removed from `scripts/input/` once enrichment succeeds

2. **Data Files**:
   - **Source Data**: Raw CSV files in `scripts/input/`
   - **Processed Data**: `public/data/<date>/enriched.geojson` and `metadata.json`
   - **Latest Date**: `public/data/latest.txt` indicates the most recent dataset

3. **Runtime Data Flow**:
   - The index page reads `latest.txt` and redirects to the newest date
   - Each date page fetches the corresponding `enriched.geojson` and `metadata.json`
   - All data is served as static files for fast loading

## Scripts

Data processing is handled by a single script:

- `scripts/enrich-data.js` - Reads CSV files from `scripts/input/` and writes GeoJSON
  with rainfall totals and tide summaries to `public/data/<date>/`

## Deployment

The application is configured for deployment to GitHub Pages:

```bash
# Deploy to GitHub Pages
npm run deploy
```

## Analytics

The application supports optional PostHog tracking. To enable analytics:

1. Copy `.env.example` to `.env` and provide your PostHog project key.

```bash
cp .env.example .env
echo "VITE_POSTHOG_KEY=YOUR_KEY" >> .env
# Optionally set VITE_POSTHOG_HOST if using a self-hosted instance
```

With `VITE_POSTHOG_KEY` set, basic page views will be recorded automatically.

