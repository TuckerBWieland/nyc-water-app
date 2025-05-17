import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOpen7DayRainfallTotal } from './rainfallServices.js';
import { isGeoJSONCollection, isSampleData } from '../src/types/geojson';
/**
 * Main function to enrich samples with rainfall data
 *
 * @param inputFilePath - Path to the GeoJSON or JSON file to enrich
 * @returns Promise that resolves when the enrichment is complete
 */
export async function enrichSamplesWithRainfallData(inputFilePath) {
  try {
    // Read the input file
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const parsedData = JSON.parse(rawData);
    // Validate and determine the data type
    let samples = [];
    let isGeoJSON = false;
    if (isGeoJSONCollection(parsedData)) {
      isGeoJSON = true;
      samples = parsedData.features;
    } else if (Array.isArray(parsedData)) {
      // Check if it's an array of sample data
      if (parsedData.length > 0 && isSampleData(parsedData[0])) {
        samples = parsedData;
      } else {
        throw new Error('Unrecognized data format: Array does not contain valid sample data');
      }
    } else {
      throw new Error('Unrecognized data format: Not a GeoJSON collection or sample data array');
    }
    // Store the original data structure for writing back later
    const sampleData = parsedData;
    // Process each sample
    let processedCount = 0;
    let enrichedCount = 0;
    for (const sample of samples) {
      processedCount++;
      // Extract coordinates and sample time based on data format
      let lat, lon, sampleDate, properties;
      if ('geometry' in sample && 'properties' in sample) {
        // GeoJSON format
        lon = sample.geometry.coordinates[0];
        lat = sample.geometry.coordinates[1];
        sampleDate = sample.properties.date || '';
        properties = sample.properties;
      } else {
        // Regular JSON format
        lat = sample.latitude || sample.lat;
        lon = sample.longitude || sample.lon;
        sampleDate = sample.date || '';
        properties = sample;
      }
      if (!lat || !lon || !sampleDate) {
        // If we don't have the date explicitly, try to get it from the filename
        if (!sampleDate) {
          const dateFromFilename = path.basename(inputFilePath).split('.')[0]; // e.g., "2025-05-09"
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateFromFilename)) {
            sampleDate = dateFromFilename;
            // Add the date to properties if not already there
            properties.date = dateFromFilename;
          }
        }
        // Skip if we still don't have required data
        if (!lat || !lon || !sampleDate) {
          console.warn('Missing required data for sample enrichment:', {
            hasLat: !!lat,
            hasLon: !!lon,
            hasSampleDate: !!sampleDate,
          });
          continue;
        }
      }
      // Get 7-day rainfall data
      const rainfallTotal = await getOpen7DayRainfallTotal(lat, lon, sampleDate);
      // Add rainfall data to the properties
      properties.rainfall_mm_7day = rainfallTotal;
      if (rainfallTotal !== null) {
        enrichedCount++;
      }
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(
      `Processed ${processedCount} samples, enriched ${enrichedCount} with rainfall data`
    );
    // Write the updated data to output file
    // For .enriched.geojson files, update them in-place
    // For regular files, create a new .enriched version
    const outputFilePath = inputFilePath.includes('.enriched.')
      ? inputFilePath
      : inputFilePath.replace('.json', '.enriched.json').replace('.geojson', '.enriched.geojson');
    fs.writeFileSync(outputFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    console.log(`Wrote enriched data to ${outputFilePath}`);
  } catch (error) {
    console.error('Error enriching samples with rainfall data:', error);
  }
}
// Only run directly if this script is called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Get __dirname equivalent in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Check for input file argument
  if (process.argv.length < 3) {
    console.error('Please provide a path to a GeoJSON or JSON file to enrich');
    process.exit(1);
  }
  const inputFilePath = process.argv[2];
  // Execute the main function
  enrichSamplesWithRainfallData(inputFilePath)
    .then(() => {
      console.log('Rainfall enrichment completed successfully');
    })
    .catch(error => {
      console.error('Rainfall enrichment failed:', error);
      process.exit(1);
    });
}
