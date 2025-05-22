// Utilities for fetching and analyzing tide data from NOAA

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Calculate distance between two lat/lon pairs using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format a Date for the NOAA API (yyyy-MM-dd HH:mm).
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Find the nearest NOAA tide station to the given location.
 * Searches within 5km and falls back to 10km.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{id:string,name:string}|null>}
 */
async function findNearestTideStation(lat, lon) {
  try {
    const res = await fetch(
      'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json'
    );
    const data = await res.json();
    if (!data.stations || data.stations.length === 0) {
      return null;
    }

    let nearest = null;
    let minDist = Infinity;
    for (const station of data.stations) {
      if (!station.lat || !station.lng) continue;
      const dist = calculateDistance(lat, lon, station.lat, station.lng);
      if (dist <= 5 && dist < minDist) {
        minDist = dist;
        nearest = { id: station.id, name: station.name };
      }
    }

    if (!nearest) {
      for (const station of data.stations) {
        if (!station.lat || !station.lng) continue;
        const dist = calculateDistance(lat, lon, station.lat, station.lng);
        if (dist <= 10 && dist < minDist) {
          minDist = dist;
          nearest = { id: station.id, name: station.name };
        }
      }
    }

    return nearest;
  } catch (err) {
    console.error('Error fetching tide stations:', err);
    return null;
  }
}

/**
 * Fetch tide readings around the sample time for the given station.
 * @param {string} stationId
 * @param {string} sampleTime ISO date string
 * @returns {Promise<string>} Tide height in feet or "N/A"
 */
async function getTideData(stationId, sampleTime) {
  try {
    const sampleDate = new Date(sampleTime);
    const beginDate = new Date(sampleDate.getTime() - 60 * 60000);
    const endDate = new Date(sampleDate.getTime() + 60 * 60000);
    const begin = formatDate(beginDate);
    const end = formatDate(endDate);
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${stationId}&product=predictions&datum=MLLW&time_zone=GMT&units=english&format=json&begin_date=${encodeURIComponent(begin)}&end_date=${encodeURIComponent(end)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.predictions || data.predictions.length === 0) return 'N/A';

    const predictions = data.predictions.map(p => ({
      time: new Date(p.t),
      height: parseFloat(p.v),
    }));
    let closest = predictions[0];
    let minDiff = Math.abs(predictions[0].time - sampleDate);
    for (const p of predictions) {
      const diff = Math.abs(p.time - sampleDate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    if (!closest || isNaN(closest.height)) return 'N/A';
    return closest.height.toFixed(2);
  } catch (err) {
    console.error('Error fetching tide data:', err);
    return 'N/A';
  }
}

/**
 * Analyze tide readings and return a summary string.
 * @param {Array<{t:string,v:string}>} tideData
 * @param {string} stationName
 * @param {string} sampleTime
 * @returns {string|null}
 */
function analyzeTideData(tideData, stationName, sampleTime) {
  if (!tideData || tideData.length < 4) return null;
  const readings = tideData
    .map(r => ({ time: new Date(r.t), height: parseFloat(r.v) }))
    .sort((a, b) => a.time - b.time);
  const sampleDate = new Date(sampleTime);
  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < readings.length; i++) {
    const diff = Math.abs(readings[i].time - sampleDate);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  if (closestIndex < 1 || closestIndex >= readings.length - 1) return null;
  const before = readings[closestIndex - 1];
  const after = readings[closestIndex + 1];
  const isRising = after.height > before.height;

  let max = -Infinity;
  let min = Infinity;
  for (const r of readings) {
    if (r.height > max) max = r.height;
    if (r.height < min) min = r.height;
  }
  const curr = readings[closestIndex].height;
  const highThresh = max - (max - min) * 0.2;
  const lowThresh = min + (max - min) * 0.2;
  let state = 'Mid Tide';
  if (curr >= highThresh) state = 'High Tide';
  else if (curr <= lowThresh) state = 'Low Tide';
  const icon = isRising ? '⬆️' : '⬇️';
  return `${state} – ${icon} ${isRising ? 'Rising' : 'Falling'} (${stationName})`;
}

module.exports = {
  findNearestTideStation,
  getTideData,
  analyzeTideData,
};
