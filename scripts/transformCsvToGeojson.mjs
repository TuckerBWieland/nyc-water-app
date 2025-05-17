import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'csv-parse/sync';

// Handle ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const CSV_DIR = path.join(process.cwd(), 'public', 'data', 'csv');
const GEOJSON_DIR = path.join(process.cwd(), 'public', 'data');
const INDEX_FILE = path.join(GEOJSON_DIR, 'index.json');

/**
 * Extract date from filename in format "Water Quality Viz - M_D_YYYY.csv"
 * and return in format "YYYY-MM-DD"
 */
function extractDateFromFilename(filename) {
  const dateMatch = filename.match(/Water Quality Viz - (\d+)_(\d+)_(\d+)\.csv$/i);

  if (!dateMatch) {
    throw new Error(`Could not extract date from filename: ${filename}`);
  }

  const [, month, day, year] = dateMatch;
  // Pad month and day with leading zeros if needed
  const formattedMonth = month.padStart(2, '0');
  const formattedDay = day.padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
}

/**
 * Convert CSV data to GeoJSON
 */
function convertCsvToGeoJson(csvData, date) {
  const features = csvData
    .filter(row => {
      // Skip rows without coordinates, MPN, or Sample Time
      const hasCoordinates =
        row.Latitude &&
        row.Longitude &&
        !isNaN(parseFloat(row.Latitude)) &&
        !isNaN(parseFloat(row.Longitude));

      // Check if MPN is a non-empty string and a valid number
      const hasMPN =
        row.MPN && row.MPN.trim() !== '' && !isNaN(Number(row.MPN.replace(/[<>]/g, '')));

      // Check if Sample Time is not blank
      const hasSampleTime = row['Sample Time'] && row['Sample Time'].trim() !== '';

      // Log skipped rows for debugging
      if (!hasCoordinates || !hasMPN || !hasSampleTime) {
        const reason = [];
        if (!hasCoordinates) reason.push('invalid coordinates');
        if (!hasMPN) reason.push('missing MPN value');
        if (!hasSampleTime) reason.push('missing Sample Time');

        console.log(
          `Skipping row with Site Name "${row['Site Name'] || 'Unknown'}" due to: ${reason.join(
            ', '
          )}`
        );
        return false;
      }

      return true;
    })
    .map((row, index) => {
      // Create a clean properties object
      const properties = {
        'Site Name': row['Site Name'] || '',
        'Sample Time': row['Sample Time'] || '',
        MPN: '', // Default to empty string
        date: date,
      };

      // Convert lat/lon from strings to numbers
      const lat = parseFloat(row.Latitude);
      const lon = parseFloat(row.Longitude);

      // Process MPN value if it exists
      if (row.MPN) {
        if (row.MPN.toLowerCase() === 'null' || row.MPN === '') {
          properties.MPN = null;
        } else if (!isNaN(Number(row.MPN.replace(/[<>]/g, '')))) {
          // Handle "<10" format
          if (row.MPN.startsWith('<')) {
            properties.MPN = parseFloat(row.MPN.substring(1)) - 1;
          } else {
            properties.MPN = parseFloat(row.MPN);
          }
        } else {
          properties.MPN = row.MPN; // Keep as string if can't convert
        }
      }

      return {
        type: 'Feature',
        id: index,
        geometry: {
          type: 'Point',
          coordinates: [lon, lat], // GeoJSON uses [longitude, latitude]
        },
        properties,
      };
    });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Update index.json with list of available dates
 */
function updateIndexFile(availableDates) {
  // Sort dates in ascending order
  const sortedDates = [...availableDates].sort();
  const latestDate = sortedDates[sortedDates.length - 1];

  const indexContent = {
    dates: sortedDates,
    latest: latestDate,
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexContent, null, 2));
  console.log(`Updated index file with ${sortedDates.length} dates`);
}

/**
 * Main function to process all CSV files
 */
function processAllCsvFiles() {
  // Check if CSV directory exists
  if (!fs.existsSync(CSV_DIR)) {
    console.error(`CSV directory does not exist: ${CSV_DIR}`);
    return;
  }

  // Ensure the GeoJSON directory exists
  if (!fs.existsSync(GEOJSON_DIR)) {
    fs.mkdirSync(GEOJSON_DIR, { recursive: true });
  }

  // Get all CSV files
  const csvFiles = fs
    .readdirSync(CSV_DIR)
    .filter(file => file.toLowerCase().endsWith('.csv') && file.includes('Water Quality Viz'));

  if (csvFiles.length === 0) {
    console.log('No CSV files found to process');
    return;
  }

  console.log(`Found ${csvFiles.length} CSV files to process`);

  const processedDates = [];

  // Process each CSV file
  for (const csvFile of csvFiles) {
    try {
      const csvFilePath = path.join(CSV_DIR, csvFile);
      const csvContent = fs.readFileSync(csvFilePath, 'utf8');

      // Parse CSV
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Extract date from filename
      const date = extractDateFromFilename(csvFile);
      processedDates.push(date);

      // Convert to GeoJSON
      const geoJson = convertCsvToGeoJson(rows, date);

      // Save GeoJSON file
      const geoJsonFilePath = path.join(GEOJSON_DIR, `${date}.geojson`);
      fs.writeFileSync(geoJsonFilePath, JSON.stringify(geoJson, null, 2));

      console.log(`Successfully converted ${csvFile} to ${date}.geojson`);
    } catch (error) {
      console.error(`Error processing ${csvFile}:`, error);
    }
  }

  // Get existing dates from GeoJSON files
  const existingDates = fs
    .readdirSync(GEOJSON_DIR)
    .filter(file => file.endsWith('.geojson') && !file.includes('.enriched.'))
    .map(file => path.basename(file, '.geojson'));

  // Combine existing and newly processed dates
  const allDates = [...new Set([...existingDates, ...processedDates])];

  // Update index file with all available dates
  updateIndexFile(allDates);
}

// Run the main function
processAllCsvFiles();
