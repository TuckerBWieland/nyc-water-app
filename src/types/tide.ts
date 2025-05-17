/**
 * NOAA Tide Data Types
 *
 * This module provides TypeScript interfaces and type guards for tide data
 * retrieved from NOAA APIs. It includes definitions for tide stations,
 * tide readings, processed data, and API responses.
 *
 * @module types/tide
 */

/**
 * NOAA Tide Station information
 * Represents a physical tide monitoring station
 *
 * @interface TideStation
 * @property {string} id - Unique identifier for the station (e.g., "8518750")
 * @property {string} name - Human-readable name of the station (e.g., "The Battery, NY")
 * @property {number} lat - Latitude coordinate of the station
 * @property {number} lng - Longitude coordinate of the station
 * @property {string} [distance] - Optional distance from sampling point (with units)
 */
export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: string;
}

/**
 * Raw tide reading from NOAA API
 * Represents a single water level measurement at a specific time
 *
 * @interface TideReading
 * @property {string} t - Timestamp in format YYYY-MM-DD HH:MM
 * @property {string} v - Water level value as string (converted to number in processing)
 */
export interface TideReading {
  t: string; // timestamp in format YYYY-MM-DD HH:MM
  v: string; // water level value as string
}

/**
 * Processed tide reading with parsed date and numeric value
 * Internal representation after processing raw NOAA data
 *
 * @interface ProcessedTideReading
 * @property {Date} time - JavaScript Date object representing the measurement time
 * @property {number} height - Water level height in meters or feet (depends on API units parameter)
 */
export interface ProcessedTideReading {
  time: Date;
  height: number;
}

/**
 * Analyzed tide status information
 * Results of tide data analysis for a specific time
 *
 * @interface TideStatus
 * @property {string} state - Tide state: 'High Tide', 'Low Tide', or 'Mid Tide'
 * @property {boolean} isRising - Whether the tide is rising (true) or falling (false)
 * @property {number} currentHeight - Current water level height
 * @property {number} minHeight - Minimum water level in the analyzed time period
 * @property {number} maxHeight - Maximum water level in the analyzed time period
 */
export interface TideStatus {
  state: string; // 'High Tide', 'Low Tide', or 'Mid Tide'
  isRising: boolean; // Whether the tide is rising or falling
  currentHeight: number;
  minHeight: number;
  maxHeight: number;
}

/**
 * NOAA Station API response
 * Response format from the NOAA stations metadata API
 *
 * @interface NOAAStationsResponse
 * @property {Array<Object>} stations - Array of station objects
 * @property {string} stations[].id - Station identifier
 * @property {string} stations[].name - Station name
 * @property {number} stations[].lat - Station latitude
 * @property {number} stations[].lng - Station longitude
 */
export interface NOAAStationsResponse {
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }>;
}

/**
 * NOAA Water Level API response
 * Response format from the NOAA water level data API
 *
 * @interface NOAAWaterLevelResponse
 * @property {TideReading[]} [data] - Array of tide readings if request was successful
 * @property {Object} [error] - Error information if request failed
 * @property {string} error.message - Error message describing the problem
 */
export interface NOAAWaterLevelResponse {
  data?: TideReading[];
  error?: {
    message: string;
  };
}

/**
 * Type guard for TideStation
 * @param obj - Object to check
 * @returns True if the object is a valid TideStation
 */
export function isTideStation(obj: any): obj is TideStation {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required properties
  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return false;
  }

  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return false;
  }

  if (typeof obj.lat !== 'number' || isNaN(obj.lat)) {
    return false;
  }

  if (typeof obj.lng !== 'number' || isNaN(obj.lng)) {
    return false;
  }

  // Check optional distance property
  if (obj.distance !== undefined && typeof obj.distance !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard for TideReading
 * @param obj - Object to check
 * @returns True if the object is a valid TideReading
 */
export function isTideReading(obj: any): obj is TideReading {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check time property - must be a string in format YYYY-MM-DD HH:MM
  if (typeof obj.t !== 'string' || !obj.t.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
    return false;
  }

  // Check value property - must be a string representing a number
  if (typeof obj.v !== 'string' || isNaN(Number(obj.v))) {
    return false;
  }

  return true;
}

/**
 * Type guard for ProcessedTideReading
 * @param obj - Object to check
 * @returns True if the object is a valid ProcessedTideReading
 */
export function isProcessedTideReading(obj: any): obj is ProcessedTideReading {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check time property - must be a Date object
  if (!(obj.time instanceof Date)) {
    return false;
  }

  // Check height property - must be a number
  if (typeof obj.height !== 'number' || isNaN(obj.height)) {
    return false;
  }

  return true;
}

/**
 * Type guard for TideStatus
 * @param obj - Object to check
 * @returns True if the object is a valid TideStatus
 */
export function isTideStatus(obj: any): obj is TideStatus {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check state property - must be one of the expected values
  if (typeof obj.state !== 'string' || !['High Tide', 'Low Tide', 'Mid Tide'].includes(obj.state)) {
    return false;
  }

  // Check isRising property - must be a boolean
  if (typeof obj.isRising !== 'boolean') {
    return false;
  }

  // Check height properties - must be numbers
  if (
    typeof obj.currentHeight !== 'number' ||
    isNaN(obj.currentHeight) ||
    typeof obj.minHeight !== 'number' ||
    isNaN(obj.minHeight) ||
    typeof obj.maxHeight !== 'number' ||
    isNaN(obj.maxHeight)
  ) {
    return false;
  }

  // Check logical constraints
  if (obj.minHeight > obj.maxHeight) {
    return false;
  }

  if (obj.currentHeight < obj.minHeight || obj.currentHeight > obj.maxHeight) {
    return false;
  }

  return true;
}

/**
 * Type guard for NOAAStationsResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAAStationsResponse
 */
export function isNOAAStationsResponse(obj: any): obj is NOAAStationsResponse {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check stations property - must be an array
  if (!Array.isArray(obj.stations)) {
    return false;
  }

  // Empty array is valid
  if (obj.stations.length === 0) {
    return true;
  }

  // For non-empty arrays, check a sample of stations (up to 5)
  // This is a performance optimization for large station lists
  const samplesToCheck = Math.min(5, obj.stations.length);

  for (let i = 0; i < samplesToCheck; i++) {
    const index = obj.stations.length <= 5 ? i : Math.floor(Math.random() * obj.stations.length);
    const station = obj.stations[index];

    if (
      !station ||
      typeof station !== 'object' ||
      typeof station.id !== 'string' ||
      typeof station.name !== 'string' ||
      typeof station.lat !== 'number' ||
      isNaN(station.lat) ||
      typeof station.lng !== 'number' ||
      isNaN(station.lng)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for NOAAWaterLevelResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAAWaterLevelResponse
 */
export function isNOAAWaterLevelResponse(obj: any): obj is NOAAWaterLevelResponse {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Response must have either data or error property
  if (obj.data === undefined && obj.error === undefined) {
    return false;
  }

  // Check data property if present
  if (obj.data !== undefined) {
    if (!Array.isArray(obj.data)) {
      return false;
    }

    // Empty array is valid
    if (obj.data.length === 0) {
      return true;
    }

    // For non-empty arrays, check a sample of readings (up to 5)
    const samplesToCheck = Math.min(5, obj.data.length);

    for (let i = 0; i < samplesToCheck; i++) {
      const index = obj.data.length <= 5 ? i : Math.floor(Math.random() * obj.data.length);
      if (!isTideReading(obj.data[index])) {
        return false;
      }
    }
  }

  // Check error property if present
  if (obj.error !== undefined) {
    if (!obj.error || typeof obj.error !== 'object' || typeof obj.error.message !== 'string') {
      return false;
    }
  }

  return true;
}
