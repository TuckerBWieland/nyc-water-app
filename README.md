# NYC Water Quality Map

An interactive web application to visualize water quality data across various sampling sites in New York City.

## Features

- Interactive map showing water quality sampling sites
- Historical data navigation with a date scroller
- Detailed information for each sampling site
- Mobile-friendly responsive design
- Light and dark theme support

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

# Preview production build
npm run preview
```

## Data Architecture

The application uses a static data approach for improved performance and reliability:

1. **Data Processing Pipeline**:
   - Raw CSV data is converted to GeoJSON during build time
   - GeoJSON files are enriched with tide information
   - All enriched data is consolidated into a single static JSON file

2. **Data Files**:
   - **Source Data**: Original CSV files in `data/csv/`
   - **Processed Data**: GeoJSON files in `public/data/geojson/` and `public/data/enriched/`
   - **Consolidated Data**: A single `src/data/all-data.json` file containing all data

3. **Runtime Data Flow**:
   - The app loads all data from the pre-compiled JSON file at startup
   - No network requests are made for map data during runtime
   - Improves performance and works seamlessly on GitHub Pages

## Scripts

The project includes several utility scripts for data processing:

- `scripts/csv-processing/csvToGeoJSON.js` - Converts CSV water quality data to GeoJSON format
- `scripts/data-enrichment/enrichAllGeojson.js` - Enriches all GeoJSON files with tide information
- `scripts/data-enrichment/enrichWithTideData.js` - Adds tide data to a specific GeoJSON file
- `scripts/enrichAndMergeAll.js` - Consolidates all enriched data into a single static JSON file

## Deployment

The application is configured for deployment to GitHub Pages:

```bash
# Deploy to GitHub Pages
npm run deploy
```