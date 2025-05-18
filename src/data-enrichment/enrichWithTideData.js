/**
 * GeoJSON Enrichment Module
 *
 * Adds tide data to water quality sample GeoJSON files.
 * This module is used by the Vite plugin and can also be used standalone.
 */

import fs from 'fs';
import path from 'path';
import {
  findNearestTideStation,
  getTideData,
  analyzeTideData,
  formatDate,
} from './tideServices.js';

/**
 * Checks if the data is a valid GeoJSON collection
 * @param {Object} data - The data to check
 * @returns {boolean} Whether the data is a valid GeoJSON collection
 */
function isGeoJSONCollection(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.type === 'FeatureCollection' &&
    Array.isArray(data.features)
  );
}

/**
 * Checks if the data is a valid sample data object
 * @param {Object} data - The data to check
 * @returns {boolean} Whether the data is a valid sample data object
 */
function isSampleData(data) {
  return (
    data &&
    typeof data === 'object' &&
    ((data.latitude !== undefined && data.longitude !== undefined) ||
      (data.lat !== undefined && data.lon !== undefined))
  );
}

/**
 * Main function to enrich samples with tide data
 *
 * @param {string} inputFilePath - Path to the GeoJSON or JSON file to enrich
 * @returns {Promise<void>} Promise that resolves when the enrichment is complete
 */
export async function enrichSamplesWithTideData(inputFilePath) {
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
      let lat, lon, sampleTime, properties;

      if ('geometry' in sample && 'properties' in sample) {
        // GeoJSON format
        lon = sample.geometry.coordinates[0];
        lat = sample.geometry.coordinates[1];
        sampleTime = sample.properties.sampleTime || sample.properties.timestamp;
        properties = sample.properties;
      } else {
        // Regular JSON format
        lat = sample.latitude || sample.lat;
        lon = sample.longitude || sample.lon;
        sampleTime = sample.sampleTime || sample.timestamp;
        properties = sample;
      }

      // Standardize sample time format if it's not already a full ISO string
      if (sampleTime && !sampleTime.includes('T')) {
        // If it's just a time like "9:02", assume it's for the sample date
        if (/^\\d{1,2}:\\d{2}(:\\d{2})?(\\s*[AP]M)?$/i.test(sampleTime)) {
          const [hours, minutes] = sampleTime
            .replace(/\\s*[AP]M/i, '')
            .split(':')
            .map(Number);
          const isPM = /PM/i.test(sampleTime);

          // Get the date from the file name or a specified date
          const dateFromFilename = path.basename(inputFilePath).split('.')[0]; // e.g., "2025-05-09"

          // Use Date.UTC to create a date in UTC
          const year = parseInt(dateFromFilename.split('-')[0], 10);
          const month = parseInt(dateFromFilename.split('-')[1], 10) - 1; // 0-based months
          const day = parseInt(dateFromFilename.split('-')[2], 10);
          const adjustedHours = isPM && hours < 12 ? hours + 12 : hours;

          // Create a UTC Date directly to avoid timezone offsets
          const sampleDate = new Date(Date.UTC(year, month, day, adjustedHours, minutes));

          // Format to consistent string format
          sampleTime = formatDate(sampleDate);
          console.log(
            `Converted sample time "${hours}:${minutes}${
              isPM ? ' PM' : ''
            }" to "${sampleTime}" (UTC)`
          );
        }
      }

      if (!lat || !lon || !sampleTime) {
        continue;
      }

      // Find the nearest tide station
      const nearestStation = await findNearestTideStation(lat, lon);

      if (!nearestStation) {
        properties.tideSummary = null;
        continue;
      }

      // Get tide data for the station
      const tideData = await getTideData(nearestStation.id, sampleTime);

      if (!tideData) {
        properties.tideSummary = null;
        continue;
      }

      // Analyze the tide data
      const tideSummary = analyzeTideData(tideData, nearestStation.name, sampleTime);

      if (tideSummary) {
        properties.tideSummary = tideSummary;
        enrichedCount++;
      } else {
        properties.tideSummary = null;
      }

      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Processed ${processedCount} samples, enriched ${enrichedCount} with tide data`);

    // Write the updated data to output file
    let outputFilePath;
    if (inputFilePath.includes('/geojson/')) {
      // If input is from geojson directory, put output in enriched directory
      const filename = path
        .basename(inputFilePath)
        .replace('.json', '.enriched.json')
        .replace('.geojson', '.enriched.geojson');
      const dir = path.dirname(path.dirname(inputFilePath));
      outputFilePath = path.join(dir, 'enriched', filename);
    } else {
      // Default behavior for backward compatibility
      outputFilePath = inputFilePath
        .replace('.json', '.enriched.json')
        .replace('.geojson', '.enriched.geojson');
    }

    // Create the directory if it doesn't exist
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    console.log(`Wrote enriched data to ${outputFilePath}`);
  } catch (error) {
    console.error('Error enriching samples with tide data:', error);
  }
}
