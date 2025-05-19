const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Papa = require('papaparse');

// NOAA API base
const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

const INPUT_SAMPLE_CSV = './scripts/input/samples.csv';
const INPUT_RAINFALL_CSV = './scripts/input/rain.csv';
const OUTPUT_DIR = './public/data';
const SAMPLE_DATE = '2025-05-08'; // update weekly to match your CSV file

async function fetchTideStatus(lat, lng, time) {
  const station = '8518750'; // Battery, NY — general fallback
  
  // Make sure we have a valid date
  let sampleDate;
  if (time && time.includes(':')) {
    // If time is just a time (like "9:30 AM"), add the sample date
    sampleDate = new Date(`${SAMPLE_DATE}T${time}`);
  } else {
    // Otherwise use the sample date
    sampleDate = new Date(SAMPLE_DATE);
  }
  
  // Make sure we have a valid date before proceeding
  if (isNaN(sampleDate.getTime())) {
    console.warn(`Invalid time value: ${time}, using default date`);
    sampleDate = new Date(SAMPLE_DATE);
  }
  
  const begin = new Date(sampleDate.getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = new Date(sampleDate.getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = `${NOAA_BASE}?product=predictions&application=water-app&begin_date=${begin}&end_date=${end}&datum=MLLW&station=${station}&time_zone=gmt&units=english&interval=hilo&format=json`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const predictions = json.predictions || [];
    const sampleTs = new Date(time).getTime();

    let closest = predictions.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.t).getTime() - sampleTs);
      const currDiff = Math.abs(new Date(curr.t).getTime() - sampleTs);
      return currDiff < prevDiff ? curr : prev;
    }, predictions[0]);

    return closest.type === 'H' ? 'High' : 'Low';
  } catch (e) {
    console.error('Tide error:', e);
    return 'N/A';
  }
}

(async () => {
  const sampleCsv = fs.readFileSync(INPUT_SAMPLE_CSV, 'utf-8');
  const rainCsv = fs.readFileSync(INPUT_RAINFALL_CSV, 'utf-8');
  const samples = Papa.parse(sampleCsv, { header: true }).data;
  const rainfall = Papa.parse(rainCsv, { header: true }).data;

  const rainByDay = rainfall.map(row => parseFloat(row['Precipitation']) || 0);
  const totalRain = rainByDay.reduce((sum, val) => sum + val, 0);

  const features = [];

  for (const s of samples) {
    // Use the actual CSV column names from your file
    if (!s.Latitude || !s.Longitude || !s.MPN || isNaN(parseFloat(s.MPN))) continue;

    const coords = [parseFloat(s.Longitude), parseFloat(s.Latitude)];
    // Process sample time to create a proper ISO datetime
    let formattedSampleTime;
    if (s['Sample Time']) {
      // Try to parse the time from the CSV
      try {
        // Standardize time format (handle both "8:30 AM" and "8:30")
        let timeStr = s['Sample Time'];
        
        // Ensure we have AM/PM if it's not there
        if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
          // Default to AM if time is before 12, PM if 12 or after
          const hourPart = parseInt(timeStr.split(':')[0]);
          timeStr = hourPart >= 12 ? `${timeStr} PM` : `${timeStr} AM`;
        }
        
        // Create a date object from the date and time
        const dateTimeStr = `${SAMPLE_DATE} ${timeStr}`;
        const dateObj = new Date(dateTimeStr);
        
        // If valid, convert to ISO format
        if (!isNaN(dateObj.getTime())) {
          formattedSampleTime = dateObj.toISOString();
        } else {
          formattedSampleTime = `${SAMPLE_DATE}T12:00:00Z`; // Default to noon
          console.warn(`Could not parse time: ${s['Sample Time']}, using default noon time`);
        }
      } catch (e) {
        formattedSampleTime = `${SAMPLE_DATE}T12:00:00Z`; // Default to noon
        console.warn(`Error parsing time: ${s['Sample Time']}, using default noon time`, e);
      }
    } else {
      // No time provided, default to noon
      formattedSampleTime = `${SAMPLE_DATE}T12:00:00Z`;
    }
    
    const tide = await fetchTideStatus(s.Latitude, s.Longitude, s['Sample Time']);
    const tideFormatted = tide + " Tide (Battery)";

    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: {
        siteName: s['Site Name'], // Renamed from site to siteName
        mpn: parseFloat(s.MPN),
        sampleTime: formattedSampleTime, // Now in ISO format
        rainByDay,
        totalRain, // Rainfall value in the expected property
        tide: tideFormatted // Renamed from tideSummary to tide
      }
    };
    
    features.push(feature);
  }

  const outputPath = path.join(OUTPUT_DIR, SAMPLE_DATE);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'enriched.geojson'), JSON.stringify({ type: 'FeatureCollection', features }, null, 2));
  fs.writeFileSync(path.join(outputPath, 'metadata.json'), JSON.stringify({ date: SAMPLE_DATE, totalRain }, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.txt'), SAMPLE_DATE);

  console.log(`✅ Enriched ${features.length} samples with tide + rain for ${SAMPLE_DATE}`);
  
  // Log the first feature's properties for schema validation
  if (features.length > 0) {
    console.log('\n🧪 Sample feature properties (first item):');
    console.log(JSON.stringify(features[0].properties, null, 2));
  }
})();