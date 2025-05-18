/**
 * Script to convert CSV water quality data to GeoJSON format
 * Handles different CSV formats and extracts key information
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default paths
const DEFAULT_CSV_DIR = path.join(__dirname, '..', 'public', 'data', 'csv');
const DEFAULT_GEOJSON_DIR = path.join(__dirname, '..', 'public', 'data');

/**
 * Convert a CSV file to GeoJSON format
 * @param {string} csvPath - Path to the CSV file
 * @param {string} outputPath - Path to save the GeoJSON file
 * @returns {Promise<string>} Path to the generated GeoJSON file
 */
export async function convertCsvToGeoJson(csvPath, outputPath) {
  try {
    console.log(`Converting ${csvPath} to GeoJSON...`);
    
    // Read and parse the CSV file
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (!records || records.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Detect CSV format
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord);
    
    // Map common column names to standardized field names
    const latColumn = findColumn(columns, ['Latitude', 'lat', 'LAT', 'Y']);
    const lonColumn = findColumn(columns, ['Longitude', 'lon', 'LON', 'long', 'X']);
    const siteColumn = findColumn(columns, ['Site Name', 'site', 'SITE', 'Location', 'SiteName']);
    const mpnColumn = findColumn(columns, ['MPN', 'mpn', 'MPN/100ml', 'Result', 'Enterococci']);
    const timeColumn = findColumn(columns, ['Sample Time', 'time', 'TIME', 'sampleTime', 'Time']);
    
    if (!latColumn || !lonColumn) {
      throw new Error('Could not detect latitude and longitude columns in CSV');
    }
    
    if (!siteColumn || !mpnColumn) {
      console.warn('Missing important columns in CSV. Site or MPN data may be incomplete.');
    }
    
    // Create GeoJSON structure
    const geojson = {
      type: 'FeatureCollection',
      features: []
    };
    
    // Convert records to GeoJSON features
    for (const record of records) {
      const lat = parseFloat(record[latColumn]);
      const lon = parseFloat(record[lonColumn]);
      
      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Skipping record with invalid coordinates: ${JSON.stringify(record)}`);
        continue;
      }
      
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        properties: {
          site: record[siteColumn] || 'Unknown Site',
          mpn: parseFloat(record[mpnColumn]) || null
        }
      };
      
      // Add sample time if available
      if (timeColumn && record[timeColumn]) {
        feature.properties.sampleTime = record[timeColumn];
      }
      
      // Copy any other properties from the CSV
      for (const key of Object.keys(record)) {
        if (![latColumn, lonColumn, siteColumn, mpnColumn, timeColumn].includes(key)) {
          // Don't include empty values
          if (record[key] !== '' && record[key] !== null && record[key] !== undefined) {
            // Use camelCase for property names
            const propName = key.replace(/\s+(.)/g, (match, group) => group.toUpperCase());
            feature.properties[propName] = record[key];
          }
        }
      }
      
      geojson.features.push(feature);
    }
    
    // Write GeoJSON to file
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`Converted ${geojson.features.length} features to GeoJSON: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error converting CSV to GeoJSON:', error);
    throw error;
  }
}

/**
 * Find a column name in a list of columns by checking against common variations
 * @param {string[]} columns - Array of column names
 * @param {string[]} possibilities - Possible variations of the column name
 * @returns {string|null} Matching column name or null if not found
 */
function findColumn(columns, possibilities) {
  for (const possibility of possibilities) {
    const match = columns.find(col => 
      col.toLowerCase() === possibility.toLowerCase()
    );
    if (match) return match;
  }
  return null;
}

/**
 * Process a directory of CSV files and convert them to GeoJSON
 * @param {string} [csvDir=DEFAULT_CSV_DIR] - Directory containing CSV files
 * @param {string} [outputDir=DEFAULT_GEOJSON_DIR] - Directory to save GeoJSON files
 */
export async function processCsvDirectory(csvDir = DEFAULT_CSV_DIR, outputDir = DEFAULT_GEOJSON_DIR) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all CSV files
    const files = fs.readdirSync(csvDir).filter(file => 
      file.endsWith('.csv') || file.endsWith('.CSV')
    );
    
    console.log(`Found ${files.length} CSV files to process`);
    
    if (files.length === 0) {
      console.warn(`No CSV files found in ${csvDir}`);
      return;
    }
    
    const convertedFiles = [];
    const dates = [];
    
    // Process each file
    for (const file of files) {
      try {
        // Extract date from filename
        // Expect format like "Water Quality Viz - 5_14_2025.csv"
        const dateMatch = file.match(/(\d+)_(\d+)_(\d+)/);
        
        let formattedDate;
        if (dateMatch) {
          const [_, month, day, year] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          dates.push(formattedDate);
        } else {
          // If no date in filename, use today's date
          const today = new Date();
          formattedDate = today.toISOString().split('T')[0];
        }
        
        const csvPath = path.join(csvDir, file);
        const outputPath = path.join(outputDir, `${formattedDate}.geojson`);
        
        // Convert the file
        await convertCsvToGeoJson(csvPath, outputPath);
        convertedFiles.push({ date: formattedDate, path: outputPath });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    console.log(`Successfully converted ${convertedFiles.length} of ${files.length} files`);
    
    // Create an index file with available dates
    if (convertedFiles.length > 0) {
      const indexFile = path.join(outputDir, 'index.json');
      const sortedDates = [...dates].sort();
      const latestDate = sortedDates[sortedDates.length - 1];
      
      const indexContent = {
        dates: sortedDates,
        latest: latestDate
      };
      
      fs.writeFileSync(indexFile, JSON.stringify(indexContent, null, 2));
      console.log(`Created index.json with ${sortedDates.length} dates, latest: ${latestDate}`);
    }
    
    return convertedFiles;
  } catch (error) {
    console.error('Error processing CSV directory:', error);
    throw error;
  }
}

// Run the script directly if invoked from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  let csvDir = DEFAULT_CSV_DIR;
  let outputDir = DEFAULT_GEOJSON_DIR;
  
  // Check for custom directories
  if (process.argv.length > 2) {
    csvDir = process.argv[2];
  }
  
  if (process.argv.length > 3) {
    outputDir = process.argv[3];
  }
  
  console.log(`Processing CSV files from ${csvDir} to ${outputDir}`);
  
  processCsvDirectory(csvDir, outputDir)
    .then(() => {
      console.log('CSV to GeoJSON conversion complete');
    })
    .catch(error => {
      console.error('Conversion failed:', error);
      process.exit(1);
    });
}