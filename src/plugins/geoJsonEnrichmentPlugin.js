/**
 * GeoJSON Enrichment Plugin for Vite
 *
 * This plugin automatically enriches GeoJSON files with tide data
 * during development and build processes, replacing the manual
 * enrichment script.
 */

import fs from 'fs';
import path from 'path';
import { enrichSamplesWithTideData } from '../data-enrichment/enrichWithTideData.js';

/**
 * Default options for the plugin
 * @type {Object}
 */
const defaultOptions = {
  dataDir: 'public/data',
  geojsonDir: 'public/data/geojson',
  enrichedDir: 'public/data/enriched',
  skipInDev: false,
  include: /\.geojson$/,
  exclude: /\.enriched\.geojson$/,
};

/**
 * Create a Vite plugin that enriches GeoJSON files with tide data
 * during the build process.
 *
 * @param {Object} options - Configuration options for the plugin
 * @param {string} [options.dataDir='public/data'] - Data directory (relative to project root)
 * @param {boolean} [options.skipInDev=false] - Whether to skip enrichment in dev mode
 * @param {RegExp} [options.include=/\.geojson$/] - Only enrich files matching this pattern
 * @param {RegExp} [options.exclude=/\.enriched\.geojson$/] - Skip files matching this pattern
 * @returns {Object} Vite plugin
 */
export default function geoJsonEnrichmentPlugin(options = {}) {
  // Merge default options with user-provided options
  const config = { ...defaultOptions, ...options };

  return {
    name: 'vite-plugin-geojson-enrichment',

    /**
     * Hook that runs during build-only mode
     */
    buildStart: async function () {
      // Skip in dev mode if configured
      if (process.env.NODE_ENV === 'development' && config.skipInDev) {
        return;
      }

      const rootDir = process.cwd();
      const dataDir = path.resolve(rootDir, config.dataDir || 'public/data');

      // Check if data directory exists
      if (!fs.existsSync(dataDir)) {
        console.warn(`[GeoJSON Enrichment] Data directory not found: ${dataDir}`);
        return;
      }

      // Read all files in the data directory
      const files = fs.readdirSync(dataDir);

      // Filter files based on include/exclude patterns
      const filesToProcess = files.filter(file => {
        const includeTest = config.include ? config.include.test(file) : true;
        const excludeTest = config.exclude ? config.exclude.test(file) : false;
        return includeTest && !excludeTest;
      });

      if (filesToProcess.length === 0) {
        console.info('[GeoJSON Enrichment] No GeoJSON files found to process');
        return;
      }

      console.info(`[GeoJSON Enrichment] Found ${filesToProcess.length} GeoJSON files to process`);

      // Process each file
      let enrichedCount = 0;

      for (const file of filesToProcess) {
        const filePath = path.join(config.geojsonDir || path.join(dataDir, 'geojson'), file);
        const enrichedPath = path.join(
          config.enrichedDir || path.join(dataDir, 'enriched'),
          file.replace('.geojson', '.enriched.geojson')
        );

        // Skip if already has an enriched version
        if (fs.existsSync(enrichedPath)) {
          continue;
        }

        try {
          console.info(`[GeoJSON Enrichment] Processing ${file}...`);
          await enrichSamplesWithTideData(filePath);
          enrichedCount++;
        } catch (error) {
          console.error(`[GeoJSON Enrichment] Error processing ${file}:`, error);
        }
      }

      console.info(`[GeoJSON Enrichment] Enriched ${enrichedCount} GeoJSON files with tide data`);
    },

    /**
     * Hook that runs during dev server start
     */
    configureServer(server) {
      if (config.skipInDev) {
        console.info('[GeoJSON Enrichment] Skipping enrichment in dev mode (skipInDev=true)');
        return;
      }

      // In dev mode, we need to enrich files
      const rootDir = process.cwd();
      const dataDir = path.resolve(rootDir, config.dataDir || 'public/data');

      // Check if data directory exists
      if (!fs.existsSync(dataDir)) {
        console.warn(`[GeoJSON Enrichment] Data directory not found: ${dataDir}`);
        return;
      }

      // Process files
      const files = fs.readdirSync(dataDir);

      // Filter files based on include/exclude patterns
      const filesToProcess = files.filter(file => {
        const includeTest = config.include ? config.include.test(file) : true;
        const excludeTest = config.exclude ? config.exclude.test(file) : false;
        return includeTest && !excludeTest;
      });

      // Process each file
      for (const file of filesToProcess) {
        const filePath = path.join(config.geojsonDir || path.join(dataDir, 'geojson'), file);
        const enrichedPath = path.join(
          config.enrichedDir || path.join(dataDir, 'enriched'),
          file.replace('.geojson', '.enriched.geojson')
        );

        // Skip if already has an enriched version
        if (fs.existsSync(enrichedPath)) {
          continue;
        }

        try {
          console.info(`[GeoJSON Enrichment] Processing ${file}...`);
          enrichSamplesWithTideData(filePath).catch(err =>
            console.error(`[GeoJSON Enrichment] Error processing ${file}:`, err)
          );
        } catch (error) {
          console.error(`[GeoJSON Enrichment] Error processing ${file}:`, error);
        }
      }

      // Watch for changes to GeoJSON files
      server.watcher.add(path.join(config.geojsonDir || path.join(dataDir, 'geojson'), '*.geojson'));

      server.watcher.on('change', async changedPath => {
        // Check if it's a GeoJSON file and not already enriched
        const includeTest = config.include ? config.include.test(changedPath) : true;
        const excludeTest = config.exclude ? config.exclude.test(changedPath) : false;

        if (includeTest && !excludeTest) {
          console.info(`[GeoJSON Enrichment] File changed: ${changedPath}`);
          try {
            await enrichSamplesWithTideData(changedPath);
            console.info(`[GeoJSON Enrichment] Successfully enriched: ${changedPath}`);
          } catch (error) {
            console.error(`[GeoJSON Enrichment] Error enriching changed file:`, error);
          }
        }
      });
    },
  };
}