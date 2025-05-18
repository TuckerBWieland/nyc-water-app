/**
 * Script to enrich all GeoJSON data files with tide and rainfall information
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enrichSamplesWithTideData } from './enrichWithTideData.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default paths
const DEFAULT_GEOJSON_DIR = path.join(__dirname, '..', '..', 'public', 'data', 'geojson');

/**
 * Enriches all GeoJSON files in a directory with tide and rainfall data
 * @param {string} [dir=DEFAULT_GEOJSON_DIR] - Directory containing GeoJSON files
 * @returns {Promise<Array>} Array of processed file paths
 */
export async function enrichAllGeoJsonFiles(dir = DEFAULT_GEOJSON_DIR) {
  try {
    console.log(`Enriching GeoJSON files in ${dir}...`);

    // Check if directory exists
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory ${dir} does not exist`);
    }

    // Get all GeoJSON files (but not already enriched ones)
    const files = fs
      .readdirSync(dir)
      .filter(file => file.endsWith('.geojson') && !file.includes('enriched'));

    console.log(`Found ${files.length} GeoJSON files to enrich`);

    if (files.length === 0) {
      console.warn(`No GeoJSON files found in ${dir}`);
      return [];
    }

    const processedFiles = [];

    // Process each file in sequence to avoid rate limits
    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        console.log(`Enriching ${file} with tide data...`);

        // Enrich with tide data
        await enrichSamplesWithTideData(filePath);

        // Add to list of processed files
        processedFiles.push(filePath);

        // Add a delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error enriching ${file}:`, error);
      }
    }

    console.log(`Successfully enriched ${processedFiles.length} of ${files.length} files`);
    return processedFiles;
  } catch (error) {
    console.error('Error enriching GeoJSON files:', error);
    throw error;
  }
}

// Run the script directly if invoked from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  let dir = DEFAULT_GEOJSON_DIR;

  // Check for custom directory
  if (process.argv.length > 2) {
    dir = process.argv[2];
  }

  console.log(`Enriching GeoJSON files in ${dir}`);

  enrichAllGeoJsonFiles(dir)
    .then(files => {
      console.log(`GeoJSON enrichment complete. Processed ${files.length} files.`);
    })
    .catch(error => {
      console.error('Enrichment failed:', error);
      process.exit(1);
    });
}
