#!/bin/bash

# This script handles the full build process with CSV conversion and enrichment

# Step 1: Convert CSV files to GeoJSON
echo "Step 1: Converting CSV files to GeoJSON..."
node scripts/transformCsvToGeojson.mjs

# Step 2: Compile the TypeScript files
echo "Step 2: Compiling TypeScript files..."
npm run compile-scripts

# Step 3: Run the enrichment script on the GeoJSON files
echo "Step 3: Enriching GeoJSON files with tide data..."
node dist/enrichAllGeojson.js

# Step 4: Run the build
echo "Step 4: Building the application..."
vite build

echo "Build process completed successfully!"