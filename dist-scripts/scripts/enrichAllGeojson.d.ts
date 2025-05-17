/**
 * NOAA Tide & Rainfall Data Enrichment - Batch Processor
 *
 * This script automatically processes all GeoJSON files in the public/data folder
 * that don't already have corresponding enriched versions.
 *
 * Usage:
 *   node scripts/enrichAllGeojson.js
 *
 * The script will:
 * 1. Find all .geojson files in public/data/
 * 2. For each file without a corresponding .enriched.geojson version,
 *    run the enrichWithTideData.js and enrichWithRainfallData.js scripts on it
 * 3. Original files remain untouched
 */
export {};
