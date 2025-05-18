/**
 * Tide data services for the NYC Water Quality App
 *
 * This module provides functions to work with NOAA tide data,
 * including finding the nearest tide station, fetching tide data,
 * and analyzing tide status.
 */

import fetch from 'node-fetch';

/**
 * List of NOAA tide stations in the New York area
 * @type {Array<{id: string, name: string, lat: number, lon: number, state: string}>}
 */
const NEW_YORK_STATIONS = [
  { id: '8518750', name: 'The Battery', lat: 40.7, lon: -74.015, state: 'NY' },
  { id: '8531680', name: 'Sandy Hook', lat: 40.467, lon: -74.01, state: 'NJ' },
  { id: '8516945', name: 'Kings Point', lat: 40.81, lon: -73.765, state: 'NY' },
  { id: '8519483', name: 'Bergen Point', lat: 40.6383, lon: -74.1467, state: 'NY' },
  { id: '8510560', name: 'Montauk', lat: 41.0485, lon: -71.96, state: 'NY' },
  { id: '8467150', name: 'Bridgeport', lat: 41.173, lon: -73.1833, state: 'CT' },
  { id: '8516990', name: 'Willets Point', lat: 40.7933, lon: -73.7817, state: 'NY' },
  { id: '8518639', name: 'New York (Pier 17)', lat: 40.7066, lon: -74.0019, state: 'NY' },
  { id: '8518643', name: 'Dyckman Street', lat: 40.872, lon: -73.935, state: 'NY' },
  { id: '8518687', name: 'Randalls Island', lat: 40.7933, lon: -73.9217, state: 'NY' },
  { id: '8517756', name: 'Worlds Fair Marina', lat: 40.7595, lon: -73.8559, state: 'NY' },
  { id: '8518526', name: 'Williamsburg', lat: 40.7127, lon: -73.95, state: 'NY' },
  { id: '8517941', name: 'Gowanus Bay', lat: 40.67, lon: -74.0133, state: 'NY' },
  { id: '8530973', name: 'Raritan Bay', lat: 40.4878, lon: -74.2509, state: 'NJ' },
  { id: '8519050', name: 'Coney Island', lat: 40.567, lon: -73.983, state: 'NY' },
  { id: '8519436', name: 'Rockaway Inlet', lat: 40.5733, lon: -73.88, state: 'NY' },
];

/**
 * Calculates the distance between two coordinate points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert to radians
  const rad1 = (Math.PI * lat1) / 180;
  const rad2 = (Math.PI * lat2) / 180;
  const theta = (Math.PI * (lon1 - lon2)) / 180;

  // Haversine formula
  let dist = Math.sin(rad1) * Math.sin(rad2) + Math.cos(rad1) * Math.cos(rad2) * Math.cos(theta);
  dist = Math.acos(Math.min(dist, 1)); // Clamp to avoid floating point errors
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515 * 1.609344; // Convert to kilometers

  return dist;
}

/**
 * Find the nearest tide station to given coordinates
 * @param {number} lat - Latitude of the location
 * @param {number} lon - Longitude of the location
 * @returns {Promise<Object|null>} The nearest tide station or null if none found
 */
export async function findNearestTideStation(lat, lon) {
  // Calculate distances to all stations
  const stationsWithDistance = NEW_YORK_STATIONS.map(station => ({
    ...station,
    distance: calculateDistance(lat, lon, station.lat, station.lon),
  }));

  // Sort by distance
  stationsWithDistance.sort((a, b) => a.distance - b.distance);

  // Return the closest one
  return stationsWithDistance.length > 0 ? stationsWithDistance[0] : null;
}

/**
 * Format a date in ISO format with consistent timezone handling
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  // Format to ISO-8601 in UTC
  return date.toISOString();
}

/**
 * Get tide data for a specific station and time
 * @param {string} stationId - NOAA station ID
 * @param {string} dateTime - Date and time to get tide data for
 * @returns {Promise<Array|null>} Array of tide predictions or null if error
 */
export async function getTideData(stationId, dateTime) {
  try {
    // Parse the date to create a time window
    const date = new Date(dateTime);
    const startDate = new Date(date);
    const endDate = new Date(date);

    // Set time window to 12 hours before and after
    startDate.setHours(date.getHours() - 12);
    endDate.setHours(date.getHours() + 12);

    // Format dates for the API
    const startDateFormatted = formatDate(startDate).split('T')[0];
    const endDateFormatted = formatDate(endDate).split('T')[0];

    // Construct the API URL
    const apiUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${stationId}&begin_date=${startDateFormatted}&end_date=${endDateFormatted}&product=predictions&datum=MLLW&time_zone=gmt&units=metric&format=json&application=nyc_water_app`;

    // Fetch the data
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check if we got valid predictions
    if (
      !data ||
      typeof data !== 'object' ||
      !('predictions' in data) ||
      !Array.isArray(data.predictions)
    ) {
      console.error('Invalid tide data response:', data);
      return null;
    }

    // Extract high and low tide times
    const tides = data.predictions
      .filter(prediction => prediction.type === 'H' || prediction.type === 'L')
      .map(prediction => ({
        time: prediction.t,
        height: parseFloat(prediction.v),
        type: prediction.type,
      }));

    return tides;
  } catch (error) {
    console.error('Error fetching tide data:', error);
    return null;
  }
}

/**
 * Analyze tide data to determine tide status at sample time
 * @param {Array} tides - Array of tide predictions
 * @param {string} stationName - Name of the tide station
 * @param {string} sampleTime - Time the sample was taken
 * @returns {string|null} Tide status summary or null if unable to determine
 */
export function analyzeTideData(tides, stationName, sampleTime) {
  if (!tides || tides.length === 0) {
    return null;
  }

  try {
    // Convert sampleTime to Date for comparison
    const sampleTimeDate = new Date(sampleTime);

    // Find the closest tide events before and after the sample time
    let prevTide = null;
    let nextTide = null;

    for (const tide of tides) {
      const tideTime = new Date(tide.time);

      if (tideTime <= sampleTimeDate) {
        // This tide is before or at the sample time
        if (!prevTide || new Date(prevTide.time) < tideTime) {
          prevTide = tide;
        }
      } else {
        // This tide is after the sample time
        if (!nextTide || new Date(nextTide.time) > tideTime) {
          nextTide = tide;
        }
      }
    }

    // If we don't have both previous and next tides, return null
    if (!prevTide || !nextTide) {
      return null;
    }

    // Determine whether the tide is rising or falling
    const isRising = prevTide.type === 'L' && nextTide.type === 'H';
    const isFalling = prevTide.type === 'H' && nextTide.type === 'L';

    // Format the tide summary
    let status;

    if (prevTide.type === 'H') {
      status = `High Tide  ${isFalling ? ' Falling' : ' Rising'}`;
    } else {
      status = `Low Tide  ${isRising ? ' Rising' : ' Falling'}`;
    }

    // Add station info
    const stationInfo = stationName ? ` (${stationName})` : '';

    return `${status}${stationInfo}`;
  } catch (error) {
    console.error('Error analyzing tide data:', error);
    return null;
  }
}