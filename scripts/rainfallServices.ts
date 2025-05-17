import nodeFetch from 'node-fetch';
import { parseDateUTC } from './parseDateUTC.js';
import type {
  RainfallStation,
  NOAARainfallData,
  NOAARainfallResponse,
} from '../src/types/rainfall';
import {
  isRainfallStation,
  isNOAARainfallData,
  isNOAARainfallResponse,
} from '../src/types/rainfall';
import { calculateDistance } from './tideServices.js';

const fetch = nodeFetch;

/**
 * Finds the nearest NOAA rainfall station within configurable distance of the given lat/lon
 *
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @returns Promise resolving to nearest station or null if none found
 */
export async function findNearestRainfallStation(
  lat: number,
  lon: number
): Promise<RainfallStation | null> {
  try {
    // NOAA NCEI API endpoint for listing weather stations
    // Using the Global Historical Climatology Network (GHCN) datasets
    const response = await fetch(
      'https://www.ncdc.noaa.gov/cdo-web/api/v2/stations?limit=1000&datasetid=GHCND&extent=39,-75,42,-72',
      {
        headers: {
          token: 'insert-token-here', // Replace with actual token when ready
        },
      }
    );

    const data = await response.json() as { results: Array<{
      id: string;
      name: string;
      latitude: string;
      longitude: string;
    }> };

    // Transform data to our station format
    const stations = data.results.map(station => ({
      id: station.id,
      name: station.name,
      lat: parseFloat(station.latitude),
      lng: parseFloat(station.longitude),
    }));

    // First try with a 10km radius
    const stationWithin10km = findNearestStationWithinRadius(stations, lat, lon, 10);
    if (stationWithin10km) {
      return stationWithin10km;
    }

    // If no station within 10km, try with a 25km radius
    const stationWithin25km = findNearestStationWithinRadius(stations, lat, lon, 25);
    if (stationWithin25km) {
      return stationWithin25km;
    }

    // If still no station, use the closest one we can find within 50km
    return findNearestStationWithinRadius(stations, lat, lon, 50);
  } catch (error) {
    console.error('Error finding nearest rainfall station:', error);
    return null;
  }
}

/**
 * Helper function to find the nearest station within a given radius
 *
 * @param stations - Array of rainfall stations
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @param maxDistanceKm - Maximum distance to search within
 * @returns Nearest station or null if none found
 */
export function findNearestStationWithinRadius(
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }>,
  lat: number,
  lon: number,
  maxDistanceKm: number
): RainfallStation | null {
  let nearestStation: RainfallStation | null = null;
  let minDistance = Infinity;

  for (const station of stations) {
    // Calculate distance between sample location and this station
    const distance = calculateDistance(lat, lon, station.lat, station.lng);

    // Update nearest station if this one is closer and within the radius
    if (distance <= maxDistanceKm && distance < minDistance) {
      minDistance = distance;
      nearestStation = {
        id: station.id,
        name: station.name,
        lat: station.lat,
        lng: station.lng,
        distance: distance.toFixed(2),
      };
    }
  }

  return nearestStation;
}

/**
 * Format date as YYYY-MM-DD
 *
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForRainfall(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets 7-day rainfall data ending on the specified date
 * Note: This implementation is kept for reference but we're using Open-Meteo
 * since it doesn't require API keys
 *
 * @param stationId - NOAA station ID
 * @param sampleDate - End date for the 7-day period (usually the sample date)
 * @returns Promise resolving to 7-day total rainfall in mm or null if data unavailable
 */
export async function get7DayRainfallTotal(
  stationId: string,
  sampleDate: string | Date
): Promise<number | null> {
  try {
    // Parse the sample date with explicit UTC handling
    const endDate = parseDateUTC(sampleDate);

    // Calculate the start date (7 days before the sample date)
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 7);

    // Format dates for the API
    const startDateStr = formatDateForRainfall(startDate);
    const endDateStr = formatDateForRainfall(endDate);

    console.warn('NOAA API requires a token - use getOpen7DayRainfallTotal instead');
    return null;

    /* Commented out as this requires an API token
    // NOAA API endpoint for daily precipitation data
    // Using the Global Historical Climatology Network Daily (GHCND) dataset
    const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=${stationId}&startdate=${startDateStr}&enddate=${endDateStr}&datatypeid=PRCP&limit=31&units=metric`;
    
    const response = await fetch(url, {
      headers: {
        'token': 'YOUR_TOKEN_HERE'
      }
    });
    
    const data = await response.json();
    
    // Handle empty or error responses
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    // Filter for precipitation data only
    const precipData = data.results.filter(item => item.datatype === 'PRCP');
    
    // Sum up the rainfall values (values are in tenths of mm, so divide by 10 to get mm)
    let totalRainfall = 0;
    for (const item of precipData) {
      totalRainfall += item.value / 10; // Convert to mm
    }
    
    // Round to 1 decimal place
    return Math.round(totalRainfall * 10) / 10;
    */
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    return null;
  }
}

// Define interface for Open-Meteo API response
interface OpenMeteoResponse {
  daily?: {
    precipitation_sum?: number[];
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Gets 7-day rainfall data using Open-Meteo historical API (alternative to NOAA)
 *
 * @param lat - Latitude of the sample location
 * @param lon - Longitude of the sample location
 * @param sampleDate - End date for the 7-day period (usually the sample date)
 * @returns Promise resolving to 7-day total rainfall in mm or null if data unavailable
 */
export async function getOpen7DayRainfallTotal(
  lat: number,
  lon: number,
  sampleDate: string | Date
): Promise<number | null> {
  try {
    // Parse the sample date with explicit UTC handling
    const endDate = parseDateUTC(sampleDate);

    // Calculate the start date (7 days before the sample date)
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 7);

    // Format dates for the API (YYYY-MM-DD)
    const startDateStr = formatDateForRainfall(startDate);
    const endDateStr = formatDateForRainfall(endDate);

    // Use Open-Meteo Historical Weather API which is free and doesn't require API key
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDateStr}&end_date=${endDateStr}&daily=precipitation_sum&timezone=America%2FNew_York`;

    const response = await fetch(url);
    const data = (await response.json()) as OpenMeteoResponse;

    // Handle empty or error responses
    if (!data.daily || !data.daily.precipitation_sum) {
      console.warn(
        'No precipitation data available from Open-Meteo for the given location and dates'
      );
      return null;
    }

    // Sum up the rainfall values from the daily precipitation_sum array
    const precipValues = data.daily.precipitation_sum;
    let totalRainfall = 0;

    for (const value of precipValues) {
      // Some values might be null, skip those
      if (value !== null) {
        totalRainfall += value;
      }
    }

    // Round to 1 decimal place
    return Math.round(totalRainfall * 10) / 10;
  } catch (error) {
    console.error('Error fetching rainfall data from Open-Meteo:', error);
    return null;
  }
}
