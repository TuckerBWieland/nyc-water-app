const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const {
  findNearestTideStation,
  getTideData,
  analyzeTideData,
} = require('./tide-services');
const {
  extractDateFromFilename,
  formatSampleTime,
} = require('./parsing-utils');
const { isDateProcessed, removeProcessedData } = require('./data-utils');
const { getQualityBucket, loadHistoricalCounts } = require('./quality-utils');

// Constants
const INPUT_DIR = './scripts/input/';
const OUTPUT_DIR = './public/data';



/**
 * Find and process sample-rain file pairs
 */
async function processDatasets() {
  // Get all files in input directory
  const files = fs.readdirSync(INPUT_DIR);

  // Group files by date
  const dateMap = new Map();
  let latestDate = null;

  files.forEach(file => {
    const date = extractDateFromFilename(file);
    if (!date) return; // Skip files without a date

    // Track latest date
    if (!latestDate || date > latestDate) {
      latestDate = date;
    }

    // Group by date
    if (!dateMap.has(date)) {
      dateMap.set(date, { samples: null, rain: null });
    }

    // Categorize as sample or rain file
    if (file.toLowerCase().includes('sample')) {
      dateMap.get(date).samples = file;
    } else if (file.toLowerCase().includes('rain')) {
      dateMap.get(date).rain = file;
    }
  });

  // Remove any existing processed data so we can overwrite with new files
  for (const date of dateMap.keys()) {
    if (isDateProcessed(OUTPUT_DIR, date)) {
      console.warn(`⚠️  Data for ${date} already exists and will be overwritten.`);
      removeProcessedData(OUTPUT_DIR, date);
    }
  }

  // Process each date that has both sample and rain files
  let processedDates = 0;

  // Load existing history counts after cleaning any overwritten dates
  const historyCounts = loadHistoricalCounts(OUTPUT_DIR);

  for (const [date, files] of dateMap.entries()) {
    if (files.samples && files.rain) {
      const success = await processDateFiles(date, files.samples, files.rain, historyCounts);
      if (success) {
        processedDates++;
        try {
          fs.unlinkSync(path.join(INPUT_DIR, files.samples));
          fs.unlinkSync(path.join(INPUT_DIR, files.rain));
        } catch (err) {
          console.warn(`⚠️  Could not delete input files for ${date}:`, err);
        }
      }
    } else {
      console.warn(
        `Incomplete data for ${date}: samples=${files.samples ? 'Yes' : 'No'}, rain=${files.rain ? 'Yes' : 'No'}`
      );
    }
  }

  // Update latest.txt if we processed any dates
  if (latestDate && processedDates > 0) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.txt'), latestDate);
  } else {
    console.warn('⚠️ No complete data sets found. No files processed.');
  }

  // Always update dates.json to reflect available datasets
  try {
    const dirs = fs
      .readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
      .map(d => d.name)
      .sort();
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'dates.json'),
    JSON.stringify(dirs, null, 2)
  );
  } catch (err) {
    console.warn('⚠️ Failed to update dates.json:', err);
  }
}

/**
 * Process a single date's sample and rain files
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} sampleFile - Sample file name
 * @param {string} rainFile - Rain file name
 */
async function processDateFiles(date, sampleFile, rainFile, historyCounts) {

  try {
    // Read and parse files
    const sampleData = fs.readFileSync(path.join(INPUT_DIR, sampleFile), 'utf-8');
    const rainData = fs.readFileSync(path.join(INPUT_DIR, rainFile), 'utf-8');

    const samples = Papa.parse(sampleData, { header: true }).data;
    const rainfall = Papa.parse(rainData, { header: true }).data;

    // Extract rainfall data - look for column named Precipitation, rainfall, or similar
    const rainColumn =
      Object.keys(rainfall[0]).find(
        key => key.toLowerCase().includes('precip') || key.toLowerCase().includes('rain')
      ) || Object.keys(rainfall[0])[0]; // Fallback to first column

    const rainByDay = rainfall
      .map(row => parseFloat(row[rainColumn]))
      .filter(v => !Number.isNaN(v))
      .slice(-7);

    const totalRain = rainByDay.reduce((sum, val) => sum + val, 0);
    // Convert the 7-day rainfall total from inches to millimeters for easier
    // use in the UI. 1 inch equals 25.4 millimeters.
    const rainfall_mm_7day = totalRain * 25.4;

    // Process sample points
    const features = [];
    let skipped = 0;
    let skippedLatLng = 0;
    let skippedMpn = 0;
    const totalSites = samples.length;

    for (const sample of samples) {
      // Extract and validate required fields
      const siteName = sample['Site Name'] || sample['site'] || sample['Site'] || '';
      const lat = parseFloat(sample['Latitude'] || sample['latitude'] || sample['LAT']);
      const lng = parseFloat(sample['Longitude'] || sample['longitude'] || sample['LNG']);
      const mpnValue = parseFloat(sample['MPN'] || sample['mpn']);
      const sampleTime = sample['Sample Time'] || sample['Time'] || sample['time'] || '';

      // Skip samples with missing critical data
      const missingLatLng = isNaN(lat) || isNaN(lng);
      const missingMpn = isNaN(mpnValue);
      if (missingLatLng || missingMpn) {
        skipped++;
        if (missingLatLng) skippedLatLng++;
        if (missingMpn) skippedMpn++;
        continue;
      }

      const isoTime = formatSampleTime(date, sampleTime);

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          siteName,
          mpn: mpnValue,
          timestamp: isoTime,
          rainByDay,
          totalRain,
          rainfall_mm_7day,
        },
      };

      try {
        const station = await findNearestTideStation(lat, lng);
        if (!station) {
          feature.properties.tideHeight = 'No tide station nearby';
          feature.properties.tideState = 'Tide info unavailable';
          feature.properties.tide = feature.properties.tideState;
        } else {
          const { height, predictions } = await getTideData(
            station.id,
            feature.properties.timestamp,
          );
          feature.properties.tideHeight =
            height === 'N/A' ? 'N/A' : `${height} ft`;
          const tideSummary = analyzeTideData(
            predictions,
            station.name,
            feature.properties.timestamp,
          );
          feature.properties.tideState = tideSummary || 'Tide info unavailable';
          feature.properties.tide = feature.properties.tideState;
        }
      } catch (err) {
        console.warn('Tide enrichment failed:', err);
        feature.properties.tideHeight = 'N/A';
        feature.properties.tideState = 'Tide info unavailable';
        feature.properties.tide = feature.properties.tideState;
      }

      // Update historical quality counts
      if (!historyCounts.has(siteName)) {
        historyCounts.set(siteName, { good: 0, caution: 0, poor: 0 });
      }
      const bucket = getQualityBucket(mpnValue);
      historyCounts.get(siteName)[bucket]++;
      const { good, caution, poor } = historyCounts.get(siteName);

      feature.properties.goodCount = good;
      feature.properties.cautionCount = caution;
      feature.properties.poorCount = poor;

      features.push(feature);
    }

    // Create output directory if it doesn't exist
    const outputPath = path.join(OUTPUT_DIR, date);
    fs.mkdirSync(outputPath, { recursive: true });

    // Write enriched GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features,
    };
    
    // Custom JSON formatting to keep arrays compact while maintaining readability
    const jsonString = JSON.stringify(geojson, null, 2)
      .replace(/\[\s*([^\[\]]*?)\s*\]/g, (match, content) => {
        // Only compact arrays that don't contain objects or nested arrays
        if (!content.includes('{') && !content.includes('[')) {
          return `[${content.replace(/\s+/g, ' ').trim()}]`;
        }
        return match;
      });
    
    fs.writeFileSync(path.join(outputPath, 'enriched.geojson'), jsonString);

    // Write metadata
    const metadata = {
      date,
      totalRain,
      sampleCount: features.length,
      description: `Water quality samples from ${date}`,
    };
    fs.writeFileSync(path.join(outputPath, 'metadata.json'), JSON.stringify(metadata, null, 2));


    // skipped rows information previously logged

    // Log first feature as sample
    if (features.length > 0) {
      /* eslint-disable no-console */
      /* Sample feature for debugging; removed console log as per guidelines */
      /* eslint-enable no-console */
    }

    return true;
  } catch (err) {
    console.error(`❌ Error processing ${date}:`, err);
    return false;
  }
}

// Main execution
(async () => {
  try {
    await processDatasets();
  } catch (err) {
    console.error('❌ Error in enrichment process:', err);
    process.exit(1);
  }
})();
