const fs = require('fs');
const path = require('path');

const MPN_THRESHOLD_LOW = 35;
const MPN_THRESHOLD_MEDIUM = 104;

function getQualityBucket(mpn) {
  if (mpn < MPN_THRESHOLD_LOW) return 'good';
  if (mpn <= MPN_THRESHOLD_MEDIUM) return 'caution';
  return 'poor';
}

function loadHistoricalCounts(outputDir) {
  const counts = new Map();
  if (!fs.existsSync(outputDir)) return counts;

  const dirs = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
    .map(d => d.name);

  for (const dir of dirs) {
    const file = path.join(outputDir, dir, 'enriched.geojson');
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

module.exports = {
  getQualityBucket,
  loadHistoricalCounts,
};
