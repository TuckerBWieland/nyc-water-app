import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import geoJsonEnrichmentPlugin from './src/plugins/geoJsonEnrichmentPlugin.js';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nyc-water-app/',
  plugins: [
    vue(),
    geoJsonEnrichmentPlugin({
      dataDir: 'public/data',
      geojsonDir: 'public/data/geojson',
      enrichedDir: 'public/data/enriched',
      skipInDev: false, // Set to true to skip enrichment in dev mode
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.vue'],
  },
});