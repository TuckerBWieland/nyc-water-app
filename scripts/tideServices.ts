import nodeFetch from 'node-fetch';
import { parseDateUTC } from './parseDateUTC.js';
import type { 
  TideStation, 
  TideReading, 
  TideStatus, 
  ProcessedTideReading,
  NOAAStationsResponse,
  NOAAWaterLevelResponse
} from './types.js';

const fetch = nodeFetch;

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Formats a Date object for NOAA CO-OPS API (yyyy-MM-dd HH:mm)
 * 
 * @param date - Date to format
 * @returns Formatted date string in NOAA API format
 */
export function formatDate(date: Date): string {
  // Ensure we have a Date object
  const d = new Date(date);

  // Get date components (all UTC-based)
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  // Return formatted string: yyyy-MM-dd HH:mm
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Finds the nearest NOAA tide station within configurable distance of the given lat/lon
 * 
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @returns Promise resolving to nearest station or null if none found
 */
export async function findNearestTideStation(lat: number, lon: number): Promise<TideStation | null> {
  try {
    // NOAA CO-OPS API endpoint for listing all stations
    const response = await fetch(
      'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json'
    );
    const data = await response.json() as NOAAStationsResponse;

    if (!data.stations) {
      return null;
    }

    // First try with a 10km radius
    const stationWithin10km = findNearestStationWithinRadius(data.stations, lat, lon, 10);
    if (stationWithin10km) {
      return stationWithin10km;
    }

    // If no station within 10km, try with a 25km radius
    const stationWithin25km = findNearestStationWithinRadius(data.stations, lat, lon, 25);
    if (stationWithin25km) {
      return stationWithin25km;
    }

    return null;
  } catch (error) {
    console.error('Error finding nearest tide station:', error);
    return null;
  }
}

/**
 * Helper function to find the nearest station within a given radius
 * 
 * @param stations - Array of NOAA stations
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @param maxDistanceKm - Maximum distance to search within
 * @returns Nearest station or null if none found
 */
export function findNearestStationWithinRadius(
  stations: any[], 
  lat: number, 
  lon: number, 
  maxDistanceKm: number
): TideStation | null {
  let nearestStation: TideStation | null = null;
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
 * Gets tide data for a specific station around a specific time
 * 
 * @param stationId - NOAA station ID
 * @param sampleTime - Time of the water sample
 * @returns Promise resolving to array of tide readings or null if error
 */
export async function getTideData(stationId: string, sampleTime: string | Date): Promise<TideReading[] | null> {
  try {
    // Parse the sample time with explicit UTC handling to avoid timezone ambiguity
    const sampleDate = parseDateUTC(sampleTime);

    // Set the begin and end dates for the API call (90 minutes before and after the sample time)
    const beginDate = new Date(sampleDate.getTime() - 90 * 60 * 1000);
    const endDate = new Date(sampleDate.getTime() + 90 * 60 * 1000);

    // Format dates for the API using the helper function
    const begin = formatDate(beginDate);
    const end = formatDate(endDate);

    // NOAA CO-OPS API endpoint for water level data - ensure URL encoding for date parameters
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${stationId}&product=water_level&datum=MLLW&time_zone=GMT&units=english&format=json&date_time=true&begin_date=${encodeURIComponent(
      begin
    )}&end_date=${encodeURIComponent(end)}`;

    const response = await fetch(url);
    const data = await response.json() as NOAAWaterLevelResponse;

    if (data.error) {
      console.error('NOAA API error:', data.error);
      return null;
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching tide data:', error);
    return null;
  }
}

/**
 * Determines tide status by analyzing tide data points
 * 
 * @param tideData - Array of tide data points from NOAA
 * @param sampleDate - Date object representing the sample time
 * @returns Object with tide status information or null if analysis fails
 */
export function determineTideStatus(tideData: TideReading[], sampleDate: Date): TideStatus | null {
  // Ensure we have sufficient tide data
  if (!tideData || tideData.length < 4) {
    return null;
  }

  // Convert all readings to objects with parsed dates and values using proper UTC parsing
  const readings: ProcessedTideReading[] = tideData
    .map(reading => ({
      time: parseDateUTC(reading.t),
      height: parseFloat(reading.v),
    }))
    .sort((a, b) => a.time.getTime() - b.time.getTime()); // Sort by time

  // Find closest reading to the sample time
  let closestIndex = 0;
  let minTimeDiff = Infinity;

  for (let i = 0; i < readings.length; i++) {
    const timeDiff = Math.abs(readings[i].time.getTime() - sampleDate.getTime());
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestIndex = i;
    }
  }

  // Ensure we have enough points before and after
  if (closestIndex < 1 || closestIndex >= readings.length - 1) {
    return null;
  }

  // Get surrounding readings (±6-12 min)
  // Find points before the closest reading
  const pointsBefore: ProcessedTideReading[] = [];
  for (let i = closestIndex - 1; i >= 0; i--) {
    const timeDiffMinutes = (readings[closestIndex].time.getTime() - readings[i].time.getTime()) / (1000 * 60);
    if (timeDiffMinutes <= 12) {
      pointsBefore.unshift(readings[i]);
    }
    if (timeDiffMinutes > 12 || pointsBefore.length >= 2) {
      break;
    }
  }

  // Find points after the closest reading
  const pointsAfter: ProcessedTideReading[] = [];
  for (let i = closestIndex + 1; i < readings.length; i++) {
    const timeDiffMinutes = (readings[i].time.getTime() - readings[closestIndex].time.getTime()) / (1000 * 60);
    if (timeDiffMinutes <= 12) {
      pointsAfter.push(readings[i]);
    }
    if (timeDiffMinutes > 12 || pointsAfter.length >= 2) {
      break;
    }
  }

  if (pointsBefore.length === 0 || pointsAfter.length === 0) {
    return null;
  }

  // Determine if tide is rising or falling
  // Compare heights from before to after
  const beforeAvg = pointsBefore.reduce((sum, p) => sum + p.height, 0) / pointsBefore.length;
  const afterAvg = pointsAfter.reduce((sum, p) => sum + p.height, 0) / pointsAfter.length;
  const isRising = afterAvg > beforeAvg;

  // Calculate overall tide height statistics
  let maxHeight = -Infinity;
  let minHeight = Infinity;

  for (const reading of readings) {
    if (reading.height > maxHeight) maxHeight = reading.height;
    if (reading.height < minHeight) minHeight = reading.height;
  }

  const currentHeight = readings[closestIndex].height;

  // Define thresholds for high and low tide (top/bottom 20%)
  const highThreshold = maxHeight - (maxHeight - minHeight) * 0.2;
  const lowThreshold = minHeight + (maxHeight - minHeight) * 0.2;

  // Determine tide state
  let tideState = '';
  if (currentHeight >= highThreshold) {
    tideState = 'High Tide';
  } else if (currentHeight <= lowThreshold) {
    tideState = 'Low Tide';
  } else {
    tideState = 'Mid Tide';
  }

  return {
    state: tideState,
    isRising,
    currentHeight,
    minHeight,
    maxHeight,
  };
}

/**
 * Analyzes tide data and formats a tide summary string
 * 
 * @param tideData - Array of tide readings
 * @param stationName - Name of the tide station
 * @param sampleTime - Time of the water sample
 * @returns Formatted tide summary string or null if analysis fails
 */
export function analyzeTideData(
  tideData: TideReading[],
  stationName: string,
  sampleTime: string | Date
): string | null {
  if (!tideData || tideData.length < 2) {
    return null;
  }

  // Convert sample time to Date object with proper UTC handling
  const sampleDate = parseDateUTC(sampleTime);

  // Get detailed tide status
  const tideStatus = determineTideStatus(tideData, sampleDate);

  if (!tideStatus) {
    return null;
  }

  // Add arrow icon based on tide direction
  const directionIcon = tideStatus.isRising ? '⬆️' : '⬇️';

  // Construct the tide summary with icon and station name
  return `${tideStatus.state} – ${directionIcon} ${
    tideStatus.isRising ? 'Rising' : 'Falling'
  } (${stationName})`;
}