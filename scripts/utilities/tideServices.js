/**
 * Tide services for interacting with NOAA tide API
 */
import fetch from 'node-fetch';

// NOAA API endpoints
const NOAA_API_BASE_URL = 'https://api.tidesandcurrents.noaa.gov';
const STATIONS_ENDPOINT = '/mdapi/prod/webapi/stations.json';
const WATER_LEVEL_ENDPOINT = '/api/prod/datagetter';

// Cached stations data to avoid multiple API calls
let cachedStations = null;

/**
 * Format a date to UTC ISO string without milliseconds
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in UTC
 */
export function formatDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Calculate distance between two lat/lon points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Fetch all tide stations from NOAA API
 * @returns {Promise<Array>} Array of tide stations
 */
async function fetchTideStations() {
  if (cachedStations) {
    return cachedStations;
  }

  try {
    const response = await fetch(`${NOAA_API_BASE_URL}${STATIONS_ENDPOINT}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for tide stations only
    const tideStations = data.stations.filter(station => 
      station.tidal && station.tidal === true
    );
    
    console.log(`Fetched ${tideStations.length} tide stations from NOAA API`);
    cachedStations = tideStations;
    return tideStations;
  } catch (error) {
    console.error('Error fetching tide stations:', error);
    return [];
  }
}

/**
 * Find the nearest tide station to a given latitude and longitude
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} Nearest station or null if none found
 */
export async function findNearestTideStation(lat, lon) {
  try {
    const stations = await fetchTideStations();
    if (!stations || stations.length === 0) {
      console.warn('No tide stations available');
      return null;
    }

    // Calculate distance to each station
    const stationsWithDistance = stations.map(station => {
      const distance = calculateDistance(lat, lon, station.lat, station.lng);
      return { ...station, distance };
    });

    // Sort by distance
    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    // Return the nearest station
    const nearest = stationsWithDistance[0];
    console.log(`Nearest tide station: ${nearest.name} (${nearest.id}), ${nearest.distance.toFixed(2)} km away`);
    return nearest;
  } catch (error) {
    console.error('Error finding nearest tide station:', error);
    return null;
  }
}

/**
 * Fetch tide data for a specific station at a specific time
 * @param {string} stationId - NOAA station ID
 * @param {string} dateTime - ISO date string for sample time
 * @returns {Promise<Array|null>} Array of tide readings or null if failed
 */
export async function getTideData(stationId, dateTime) {
  try {
    // Parse the date and create a range 12 hours before and after
    const sampleDate = new Date(dateTime);
    
    // Calculate start time (12 hours before)
    const startDate = new Date(sampleDate);
    startDate.setHours(startDate.getHours() - 12);
    
    // Calculate end time (12 hours after)
    const endDate = new Date(sampleDate);
    endDate.setHours(endDate.getHours() + 12);
    
    // Format dates for NOAA API (YYYYMMDD HH:MM)
    const beginDate = startDate.toISOString().replace(/T|Z|-|:/g, '').substring(0, 8);
    const beginTime = startDate.toISOString().replace(/T|Z|-|:/g, '').substring(8, 12);
    const endTimeStr = endDate.toISOString().replace(/T|Z|-|:/g, '').substring(8, 12);
    
    // Build the API URL
    const url = `${NOAA_API_BASE_URL}${WATER_LEVEL_ENDPOINT}?station=${stationId}&product=predictions&begin_date=${beginDate}&begin_time=${beginTime}&end_time=${endTimeStr}&datum=MLLW&time_zone=GMT&units=english&format=json`;
    
    // Fetch the data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tide data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if we have valid predictions
    if (!data.predictions || !Array.isArray(data.predictions)) {
      console.warn(`No tide predictions found for station ${stationId}`);
      return null;
    }
    
    return data.predictions;
  } catch (error) {
    console.error(`Error fetching tide data for station ${stationId}:`, error);
    return null;
  }
}

/**
 * Analyze tide data to determine if it's high tide, low tide, rising, or falling
 * @param {Array} tideData - Array of tide readings
 * @param {string} stationName - Name of the station
 * @param {string} sampleTime - ISO date string for sample time
 * @returns {string|null} Tide summary or null if analysis failed
 */
export function analyzeTideData(tideData, stationName, sampleTime) {
  try {
    if (!tideData || tideData.length < 2) {
      return null;
    }
    
    // Parse the sample time
    const sampleDate = new Date(sampleTime);
    
    // Sort tide data by time
    const sortedData = [...tideData].sort((a, b) => {
      const timeA = new Date(a.t);
      const timeB = new Date(b.t);
      return timeA - timeB;
    });
    
    // Find the readings closest to the sample time
    let closestIndex = 0;
    let minTimeDiff = Infinity;
    
    for (let i = 0; i < sortedData.length; i++) {
      const readingTime = new Date(sortedData[i].t);
      const timeDiff = Math.abs(readingTime - sampleDate);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestIndex = i;
      }
    }
    
    // Check if we're at a local minimum (low tide) or maximum (high tide)
    const currentReading = parseFloat(sortedData[closestIndex].v);
    
    // We need at least one reading before and after to determine trend
    if (closestIndex > 0 && closestIndex < sortedData.length - 1) {
      const previousReading = parseFloat(sortedData[closestIndex - 1].v);
      const nextReading = parseFloat(sortedData[closestIndex + 1].v);
      
      // Determine if we're at a turning point
      const isLocalMin = previousReading > currentReading && nextReading > currentReading;
      const isLocalMax = previousReading < currentReading && nextReading < currentReading;
      
      // Determine the trend
      const isFalling = nextReading < currentReading;
      const isRising = nextReading > currentReading;
      
      // Build the summary
      let summary = '';
      
      if (isLocalMin) {
        summary = 'Low Tide';
      } else if (isLocalMax) {
        summary = 'High Tide';
      } else if (isFalling) {
        summary = '⬇️ Falling Tide';
      } else if (isRising) {
        summary = '⬆️ Rising Tide';
      } else {
        summary = 'Stable Tide';
      }
      
      // Add the station name
      const shortenedName = stationName.replace(', NY', '').replace(', NJ', '');
      return `${summary} (${shortenedName})`;
    }
    
    return null;
  } catch (error) {
    console.error('Error analyzing tide data:', error);
    return null;
  }
}