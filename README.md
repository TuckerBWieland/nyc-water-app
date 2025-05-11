# NYC Water Quality Map

An interactive web application to visualize water quality data across various sampling sites in New York City.

## Features

- Interactive map showing water quality sampling sites
- Historical data navigation with a date scroller
- Detailed information for each sampling site
- Mobile-friendly responsive design

## Technology Stack

- Vue 3 (Composition API)
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

## Data

The application uses GeoJSON data stored in the `public/data` directory:
- `index.json` contains metadata including available dates
- Date-specific GeoJSON files (e.g., `2025-05-09.geojson`) contain the water quality measurements for each site