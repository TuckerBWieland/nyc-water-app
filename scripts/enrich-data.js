const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Papa = require('papaparse');

// NOAA API base
const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

const INPUT_SAMPLE_CSV = './scripts/input/samples.csv';
const INPUT_RAINFALL_CSV = './scripts/input/rain.csv';
const OUTPUT_DIR = './public/data';
const SAMPLE_DATE = '2025-05-16'; // update weekly

async function fetchTideStatus(lat, lng, time) {
  const station = '8518750'; // Battery, NY — general fallback
  const begin = new Date(new Date(time).getTime() - 3 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = new Date(new Date(time).getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    if (!s.Lat || !s.Lng || !s.MPN || isNaN(parseFloat(s.MPN))) continue;

    const coords = [parseFloat(s.Lng), parseFloat(s.Lat)];
    const sampleTime = s.Date || SAMPLE_DATE;
    const tide = await fetchTideStatus(s.Lat, s.Lng, sampleTime);

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: {
        siteName: s.Site,
        sampleTime,
        mpn: parseFloat(s.MPN),
        rainByDay,
        totalRain,
        tide
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