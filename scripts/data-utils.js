const fs = require('fs');
const path = require('path');

function isDateProcessed(outputDir, date) {
  const geojsonFile = path.join(outputDir, date, 'enriched.geojson');
  return fs.existsSync(geojsonFile);
}

function removeProcessedData(outputDir, date) {
  const dir = path.join(outputDir, date);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`⚠️  Failed to remove existing data for ${date}:`, err);
  }
}

module.exports = {
  isDateProcessed,
  removeProcessedData,
};
