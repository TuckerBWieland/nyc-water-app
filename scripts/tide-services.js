"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearestTideStation = findNearestTideStation;
exports.getTideData = getTideData;
exports.analyzeTideData = analyzeTideData;
// Utilities for fetching and analyzing tide data from NOAA
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Calculate distance between two lat/lon pairs using the Haversine formula.
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Format a Date for the NOAA API (yyyy-MM-dd HH:mm).
 * @param date - Date to format
 * @returns Formatted date string
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
 * @param lat - Latitude of the location
 * @param lon - Longitude of the location
 * @returns Nearest station info or null if none found
 */
async function findNearestTideStation(lat, lon) {
    try {
        const res = await (0, node_fetch_1.default)('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json');
        const data = await res.json();
        if (!data.stations || data.stations.length === 0) {
            return null;
        }
        let nearest = null;
        let minDist = Infinity;
        // First pass: look within 5km
        for (const station of data.stations) {
            if (!station.lat || !station.lng)
                continue;
            const dist = calculateDistance(lat, lon, station.lat, station.lng);
            if (dist <= 5 && dist < minDist) {
                minDist = dist;
                nearest = { id: station.id, name: station.name };
            }
        }
        // Second pass: expand to 10km if nothing found
        if (!nearest) {
            for (const station of data.stations) {
                if (!station.lat || !station.lng)
                    continue;
                const dist = calculateDistance(lat, lon, station.lat, station.lng);
                if (dist <= 10 && dist < minDist) {
                    minDist = dist;
                    nearest = { id: station.id, name: station.name };
                }
            }
        }
        return nearest;
    }
    catch (err) {
        console.error('Error fetching tide stations:', err);
        return null;
    }
}
/**
 * Fetch tide readings around the sample time for the given station.
 * @param stationId - NOAA station ID
 * @param sampleTimestamp - ISO date string of sample time
 * @returns Tide info including height and predictions
 */
async function getTideData(stationId, sampleTimestamp) {
    const sampleDate = new Date(sampleTimestamp);
    const yyyy = sampleDate.getFullYear();
    const mm = String(sampleDate.getMonth() + 1).padStart(2, '0');
    const dd = String(sampleDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
        `?product=predictions` +
        `&datum=MLLW` +
        `&station=${stationId}` +
        `&time_zone=lst_ldt` +
        `&units=english` +
        `&interval=h` +
        `&format=json` +
        `&begin_date=${dateStr}` +
        `&end_date=${dateStr}`;
    try {
        const res = await (0, node_fetch_1.default)(url);
        const json = await res.json();
        if (!json.predictions || json.predictions.length === 0) {
            console.warn(`No tide predictions for ${stationId} on ${dateStr}`);
            return { height: 'N/A', predictions: null };
        }
        let closest = json.predictions[0];
        let minDiff = Math.abs(new Date(closest.t).getTime() - sampleDate.getTime());
        for (const pred of json.predictions) {
            const diff = Math.abs(new Date(pred.t).getTime() - sampleDate.getTime());
            if (diff < minDiff) {
                closest = pred;
                minDiff = diff;
            }
        }
        return {
            height: parseFloat(closest.v).toFixed(2),
            predictions: json.predictions,
        };
    }
    catch (err) {
        console.error(`Failed to fetch tide data for ${stationId}:`, err);
        return { height: 'N/A', predictions: null };
    }
}
/**
 * Analyze tide readings and return a summary string.
 * @param tideData - Array of tide predictions
 * @param stationName - Name of the tide station
 * @param sampleTime - Sample timestamp
 * @returns Tide analysis summary or null
 */
function analyzeTideData(tideData, stationName, sampleTime) {
    if (!tideData || tideData.length < 4)
        return null;
    const readings = tideData
        .map(r => ({ time: new Date(r.t), height: parseFloat(r.v) }))
        .sort((a, b) => a.time.getTime() - b.time.getTime());
    const sampleDate = new Date(sampleTime);
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < readings.length; i++) {
        const diff = Math.abs(readings[i].time.getTime() - sampleDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }
    if (closestIndex < 1 || closestIndex >= readings.length - 1)
        return null;
    const before = readings[closestIndex - 1];
    const after = readings[closestIndex + 1];
    const isRising = after.height > before.height;
    let max = -Infinity;
    let min = Infinity;
    for (const r of readings) {
        if (r.height > max)
            max = r.height;
        if (r.height < min)
            min = r.height;
    }
    const curr = readings[closestIndex].height;
    const highThresh = max - (max - min) * 0.2;
    const lowThresh = min + (max - min) * 0.2;
    let state = 'Mid Tide';
    if (curr >= highThresh)
        state = 'High Tide';
    else if (curr <= lowThresh)
        state = 'Low Tide';
    // Handle illogical combinations
    if ((state === 'Low Tide' && !isRising) || (state === 'High Tide' && isRising)) {
        // Just show the tide state without direction for these cases
        return `${state} (${stationName})`;
    }
    const icon = isRising ? '⬆️' : '⬇️';
    return `${state} – ${icon} ${isRising ? 'Rising' : 'Falling'} (${stationName})`;
}
