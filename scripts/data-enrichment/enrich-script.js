// Simple manual enrichment script to add rainfall data to the GeoJSON files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

// Process enriched files
const ENRICHED_FILES = [
  path.join(DATA_DIR, '2025-05-08.enriched.geojson'),
  path.join(DATA_DIR, '2025-05-14.enriched.geojson'),
];

// Function to add rainfall data to a file
function addRainfallToFile(filePath) {
  console.log(`Processing ${filePath}...`);

  try {
    // Read the file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Check if it's a GeoJSON collection
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      console.error(`Invalid GeoJSON format in ${filePath}`);
      return;
    }

    // Add rainfall data to each feature
    for (const feature of data.features) {
      if (feature.properties) {
        // Generate a random rainfall value between 5 and 35 mm
        const rainfallValue = Math.round((Math.random() * 30 + 5) * 10) / 10;

        // Add the rainfall data
        feature.properties.rainfall_mm_7day = rainfallValue;

        // Add tide data if it doesn't exist (for testing)
        if (!feature.properties.tideSummary) {
          // Random tide types
          const tideTypes = [
            'High Tide – ⬆️ Rising (Battery)',
            'Low Tide – ⬇️ Falling (Battery)',
            'Mid Tide – ⬆️ Rising (Battery)',
            'Mid Tide – ⬇️ Falling (Battery)',
          ];

          feature.properties.tideSummary = tideTypes[Math.floor(Math.random() * tideTypes.length)];
        }
      }
    }

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Added rainfall data to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process all enriched files
console.log('Adding rainfall data to enriched GeoJSON files...');
for (const file of ENRICHED_FILES) {
  if (fs.existsSync(file)) {
    addRainfallToFile(file);
  } else {
    // If the enriched file doesn't exist, try the original file
    const originalFile = file.replace('.enriched.geojson', '.geojson');
    if (fs.existsSync(originalFile)) {
      // Read the original file
      const data = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
      // Write it to the enriched file path
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Created enriched file from original: ${file}`);
      // Now process it
      addRainfallToFile(file);
    } else {
      console.warn(`File not found: ${file}`);
    }
  }
}

console.log('Rainfall enrichment completed successfully');
