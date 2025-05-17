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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
// The script will be compiled to the dist directory
const TIDE_ENRICHMENT_SCRIPT = path.join(__dirname, 'enrichWithTideData.js');
const RAINFALL_ENRICHMENT_SCRIPT = path.join(__dirname, 'enrichWithRainfallData.js');

/**
 * Function to check if Node.js exists
 * @returns boolean indicating whether node is available
 */
function checkNodeExists(): boolean {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('Node.js is not available in the PATH');
    return false;
  }
}

/**
 * Function to check if the enrichment scripts exist
 * @returns boolean indicating whether the scripts exist
 */
function checkEnrichmentScriptsExist(): boolean {
  let allScriptsExist = true;

  if (!fs.existsSync(TIDE_ENRICHMENT_SCRIPT)) {
    console.error(`Tide enrichment script not found at ${TIDE_ENRICHMENT_SCRIPT}`);
    allScriptsExist = false;
  }

  if (!fs.existsSync(RAINFALL_ENRICHMENT_SCRIPT)) {
    console.error(`Rainfall enrichment script not found at ${RAINFALL_ENRICHMENT_SCRIPT}`);
    allScriptsExist = false;
  }

  return allScriptsExist;
}

/**
 * Function to get all GeoJSON files in the data directory
 * @returns Array of filenames
 */
function getGeojsonFiles(): string[] {
  try {
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`Data directory not found at ${DATA_DIR}`);
      return [];
    }

    // Read all files in the data directory
    const files = fs.readdirSync(DATA_DIR);

    // Filter to only include .geojson files
    return files.filter(file => file.endsWith('.geojson') && !file.endsWith('.enriched.geojson'));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

/**
 * Function to check if an enriched version of a file already exists
 * @param filename - The original filename
 * @returns boolean indicating whether the enriched version exists
 */
function enrichedVersionExists(filename: string): boolean {
  const enrichedFilename = filename.replace('.geojson', '.enriched.geojson');
  return fs.existsSync(path.join(DATA_DIR, enrichedFilename));
}

/**
 * Main function to enrich all GeoJSON files
 */
function enrichAllGeoJsonFiles(): void {
  // Check prerequisites
  if (!checkNodeExists() || !checkEnrichmentScriptsExist()) {
    return;
  }

  // Get all GeoJSON files
  const geojsonFiles = getGeojsonFiles();

  if (geojsonFiles.length === 0) {
    console.log('No GeoJSON files found to process');
    return;
  }

  console.log(`Found ${geojsonFiles.length} GeoJSON files to process`);

  // Process each file
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of geojsonFiles) {
    const filePath = path.join(DATA_DIR, file);

    // Check if enriched version already exists
    if (enrichedVersionExists(file)) {
      console.log(`Skipping ${file} - enriched version already exists`);
      skippedCount++;
      continue;
    }

    try {
      console.log(`Processing ${file}...`);

      // First, run the tide enrichment script
      console.log(`- Adding tide data to ${file}...`);
      execSync(`node ${TIDE_ENRICHMENT_SCRIPT} "${filePath}"`, {
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      });

      // Then run the rainfall enrichment script on the enriched file
      console.log(`- Adding rainfall data to ${file}...`);
      const enrichedFilePath = filePath.replace('.geojson', '.enriched.geojson');
      execSync(`node ${RAINFALL_ENRICHMENT_SCRIPT} "${enrichedFilePath}"`, {
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      });

      processedCount++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('\nEnrichment process completed.');
  console.log(`  Files processed: ${processedCount}`);
  console.log(`  Files skipped: ${skippedCount}`);
  console.log(`  Total files: ${geojsonFiles.length}`);
}

// Run the main function
enrichAllGeoJsonFiles();
