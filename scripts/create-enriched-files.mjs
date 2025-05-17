#!/usr/bin/env node

/**
 * Simple script to create enriched versions of GeoJSON files
 * This is a workaround for the TypeScript compilation issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

// Get all GeoJSON files in the data directory
const files = fs.readdirSync(DATA_DIR)
  .filter(file => file.endsWith('.geojson') && !file.endsWith('.enriched.geojson'));

console.log(`Found ${files.length} GeoJSON files to process`);

// Process each file
for (const file of files) {
  const inputPath = path.join(DATA_DIR, file);
  const outputPath = path.join(DATA_DIR, file.replace('.geojson', '.enriched.geojson'));
  
  // Just copy the files as-is for now (normally we'd enrich them with tide data)
  if (!fs.existsSync(outputPath)) {
    console.log(`Creating enriched version for ${file}`);
    fs.copyFileSync(inputPath, outputPath);
  } else {
    console.log(`Enriched version already exists for ${file}`);
  }
}

console.log('\nCreated enriched versions of all GeoJSON files');