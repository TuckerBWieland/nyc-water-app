/**
 * Script to consolidate all enriched GeoJSON data into a single static JSON file
 * This reduces network requests and improves performance at runtime
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path with ESM support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ENRICHED_DIR = path.join(__dirname, '../public/data/enriched');
const OUTPUT_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all-data.json');

/**
 * Extracts date from filename (e.g., '2025-05-08.enriched.geojson' -> '2025-05-08')
 * @param {string} filename - Filename to parse
 * @returns {string} Extracted date
 */
function extractDateFromFilename(filename) {
  // Using regex to extract the date part (YYYY-MM-DD) from the filename
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})\.enriched\.geojson$/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error(`Invalid filename format: ${filename}`);
}

/**
 * Main function to process all enriched GeoJSON files and merge them
 */
async function enrichAndMergeAll() {
  try {
    console.log('Starting data consolidation...');
    
    // Ensure output directory exists
    try {
      await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
      console.log(`Created output directory: ${OUTPUT_DIR}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    // Read all enriched GeoJSON files
    const files = await fs.promises.readdir(ENRICHED_DIR);
    const enrichedFiles = files.filter(file => file.endsWith('.enriched.geojson'));
    
    if (enrichedFiles.length === 0) {
      throw new Error('No enriched GeoJSON files found');
    }
    
    console.log(`Found ${enrichedFiles.length} enriched GeoJSON files`);

    // Process each file and collect the data
    const consolidatedData = {};
    const processedDates = [];
    
    for (const filename of enrichedFiles) {
      try {
        const date = extractDateFromFilename(filename);
        processedDates.push(date);
        
        const filePath = path.join(ENRICHED_DIR, filename);
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        
        // Validate that this is a GeoJSON FeatureCollection
        if (!jsonData || jsonData.type !== 'FeatureCollection' || !Array.isArray(jsonData.features)) {
          console.warn(`Warning: ${filename} is not a valid GeoJSON FeatureCollection`);
          continue;
        }
        
        // Store the data using the date as key
        consolidatedData[date] = jsonData;
        console.log(`Processed ${filename} (${jsonData.features.length} features)`);
      } catch (err) {
        console.error(`Error processing ${filename}:`, err.message);
      }
    }
    
    // If no valid data was found, throw an error
    if (Object.keys(consolidatedData).length === 0) {
      throw new Error('No valid GeoJSON data could be processed');
    }
    
    // Add metadata
    const allData = {
      // Sort dates chronologically
      dates: processedDates.sort(),
      latest: processedDates.sort().slice(-1)[0],
      data: consolidatedData
    };
    
    // Write to the output file
    await fs.promises.writeFile(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Successfully wrote consolidated data to ${OUTPUT_FILE}`);
    
    // Log statistics
    console.log('\nSummary:');
    console.log(`Total dates processed: ${Object.keys(consolidatedData).length}`);
    console.log(`Latest date: ${allData.latest}`);
    console.log('Dates included:');
    allData.dates.forEach(date => {
      const featureCount = consolidatedData[date].features.length;
      console.log(`  - ${date}: ${featureCount} features`);
    });
    
  } catch (err) {
    console.error('Error during data consolidation:', err);
    process.exit(1);
  }
}

// Run the main function
enrichAndMergeAll();