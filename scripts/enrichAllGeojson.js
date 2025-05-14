/**
 * NOAA Tide Data Enrichment - Batch Processor
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
 *    run the enrichWithTideData.js script on it
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
const ENRICHMENT_SCRIPT = path.join(__dirname, 'enrichWithTideData.js');

// Function to check if Node.js exists
function checkNodeExists() {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if the enrichment script exists
function checkEnrichmentScriptExists() {
  if (!fs.existsSync(ENRICHMENT_SCRIPT)) {
    return false;
  }
  return true;
}

// Function to get all GeoJSON files in the data directory
function getGeojsonFiles() {
  try {
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      return [];
    }

    // Read all files in the data directory
    const files = fs.readdirSync(DATA_DIR);

    // Filter to only include .geojson files
    return files.filter(file => file.endsWith('.geojson') && !file.endsWith('.enriched.geojson'));
  } catch (error) {
    return [];
  }
}

// Function to check if an enriched version of a file already exists
function enrichedVersionExists(filename) {
  const enrichedFilename = filename.replace('.geojson', '.enriched.geojson');
  return fs.existsSync(path.join(DATA_DIR, enrichedFilename));
}

// Main function to enrich all GeoJSON files
function enrichAllGeoJsonFiles() {

  // Check prerequisites
  if (!checkNodeExists() || !checkEnrichmentScriptExists()) {
    return;
  }

  // Get all GeoJSON files
  const geojsonFiles = getGeojsonFiles();

  if (geojsonFiles.length === 0) {
    return;
  }


  // Process each file
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of geojsonFiles) {
    const filePath = path.join(DATA_DIR, file);

    // Check if enriched version already exists
    if (enrichedVersionExists(file)) {
      skippedCount++;
      continue;
    }


    try {
      // Run the enrichment script on the file
      execSync(`node ${ENRICHMENT_SCRIPT} "${filePath}"`, {
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      });

      processedCount++;
    } catch (error) {
    }
  }

  console.log('\nEnrichment process completed.');
  console.log(`  Files processed: ${processedCount}`);
  console.log(`  Files skipped: ${skippedCount}`);
  console.log(`  Total files: ${geojsonFiles.length}`);
}

// Run the main function
enrichAllGeoJsonFiles();
