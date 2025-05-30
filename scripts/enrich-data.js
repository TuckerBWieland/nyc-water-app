const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { findNearestTideStation, getTideData, analyzeTideData } = require('./tide-services');

// Thresholds for water quality buckets
const MPN_THRESHOLD_LOW = 35;
const MPN_THRESHOLD_MEDIUM = 104;

/**
 * Determine quality bucket for a given MPN value.
 * @param {number} mpn
 * @returns {'good'|'caution'|'poor'}
 */
function getQualityBucket(mpn) {
  if (mpn < MPN_THRESHOLD_LOW) return 'good';
  if (mpn <= MPN_THRESHOLD_MEDIUM) return 'caution';
  return 'poor';
}

/**
 * Load historical quality counts from existing GeoJSON files.
 * @returns {Map<string,{good:number,caution:number,poor:number}>}
 */
function loadHistoricalCounts() {
  const counts = new Map();
  if (!fs.existsSync(OUTPUT_DIR)) return counts;

  const dirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
    .map(d => d.name);

  for (const dir of dirs) {
    const file = path.join(OUTPUT_DIR, dir, 'enriched.geojson');
    if (!fs.existsSync(file)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (!data.features) continue;
      for (const feature of data.features) {
        const props = feature.properties || {};
        const site = props.siteName;
        const mpn = props.mpn;
        if (!site || mpn === undefined || mpn === null) continue;
        const bucket = getQualityBucket(Number(mpn));
        if (!counts.has(site)) {
          counts.set(site, { good: 0, caution: 0, poor: 0 });
        }
        counts.get(site)[bucket]++;
      }
    } catch (err) {
      console.warn(`Failed to load history from ${file}:`, err);
    }
  }

  return counts;
}

// Constants
const INPUT_DIR = './scripts/input/';
const OUTPUT_DIR = './public/data';

/**
 * Check if a date has already been processed by looking for an existing
 * enriched GeoJSON file.
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if data for the date already exists
 */
function isDateProcessed(date) {
  const geojsonFile = path.join(OUTPUT_DIR, date, 'enriched.geojson');
  return fs.existsSync(geojsonFile);
}

/**
 * Remove previously processed data for a given date.
 * @param {string} date - Date in YYYY-MM-DD format
 */
function removeProcessedData(date) {
  const dir = path.join(OUTPUT_DIR, date);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`⚠️  Failed to remove existing data for ${date}:`, err);
  }
}

/**
 * Extract date from filename (e.g., "samples - 2025-05-08.csv" -> "2025-05-08")
 * @param {string} filename
 * @returns {string|null} The extracted date or null if no match
 */
function extractDateFromFilename(filename) {
  const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : null;
}

/**
 * Format sample time to ISO string
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time string (could be "9:02", "9:02 AM", "13:45", etc.)
 * @returns {string} ISO formatted date-time string or null if parsing fails
 */
function formatSampleTime(date, timeStr) {
  if (!timeStr) return `${date}T12:00:00Z`; // Default to noon

  try {
    let formattedTime = timeStr.trim();
    let hour, minute;

    // Handle different time formats
    if (formattedTime.includes(':')) {
      const parts = formattedTime.split(':');
      hour = parseInt(parts[0], 10);

      // Handle minute part which might have AM/PM
      if (parts[1].includes('AM') || parts[1].includes('PM')) {
        const minMatch = parts[1].match(/(\d+)/);
        minute = minMatch ? parseInt(minMatch[1], 10) : 0;

        // Handle AM/PM
        if (parts[1].includes('PM') && hour < 12) {
          hour += 12;
        } else if (parts[1].includes('AM') && hour === 12) {
          hour = 0;
        }
      } else {
        minute = parseInt(parts[1], 10);
      }
    } else {
      // Just a number, assume it's the hour
      hour = parseInt(formattedTime, 10);
      minute = 0;
    }

    // Validate parsed values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error(`Invalid time components: hour=${hour}, minute=${minute}`);
    }

    // Format as ISO
    const isoDate = new Date(
      Date.UTC(
        parseInt(date.substring(0, 4)), // year
        parseInt(date.substring(5, 7)) - 1, // month (0-based)
        parseInt(date.substring(8, 10)), // day
        hour,
        minute
      )
    );

    return isoDate.toISOString();
  } catch (e) {
    console.warn(`Could not parse time: ${timeStr} for date ${date}. Using default.`);
    return `${date}T12:00:00Z`; // Default to noon
  }
}

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
    if (isDateProcessed(date)) {
      console.warn(`⚠️  Data for ${date} already exists and will be overwritten.`);
      removeProcessedData(date);
    }
  }

  // Process each date that has both sample and rain files
  let processedDates = 0;

  // Load existing history counts after cleaning any overwritten dates
  const historyCounts = loadHistoricalCounts();

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

    const rainByDay = rainfall.map(row => {
      const value = parseFloat(row[rainColumn]);
      return isNaN(value) ? 0 : value;
    });

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
          sampleTime: isoTime,
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
    fs.writeFileSync(path.join(outputPath, 'enriched.geojson'), JSON.stringify(geojson, null, 2));

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
