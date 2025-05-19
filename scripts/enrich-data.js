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
    const sampleTime = s['Sample Time'] || SAMPLE_DATE;
    const tide = await fetchTideStatus(s.Latitude, s.Longitude, sampleTime);

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: {
        site: s['Site Name'], // Match the property name your components expect
        mpn: parseFloat(s.MPN),
        sampleTime,
        rainByDay,
        totalRain,
        tideSummary: tide + " Tide (Battery)"
      }
    });
  }

  const outputPath = path.join(OUTPUT_DIR, SAMPLE_DATE);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'enriched.geojson'), JSON.stringify({ type: 'FeatureCollection', features }, null, 2));
  fs.writeFileSync(path.join(outputPath, 'metadata.json'), JSON.stringify({ date: SAMPLE_DATE, totalRain }, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.txt'), SAMPLE_DATE);

  console.log(`✅ Enriched ${features.length} samples with tide + rain for ${SAMPLE_DATE}`);
})();