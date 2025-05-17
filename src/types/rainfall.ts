/**
 * Rainfall data type definitions
 */

/**
 * NOAA rainfall data
 */
export interface NOAARainfallData {
  date: string;
  PRCP: number; // Precipitation in inches
  station: string;
  name?: string;
}

/**
 * NOAA rainfall station information
 */
export interface RainfallStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: string;
}

/**
 * NOAA Rainfall API response
 */
export interface NOAARainfallResponse {
  data?: NOAARainfallData[];
  error?: {
    message: string;
  };
}

/**
 * Regular expression for validating ISO date format (YYYY-MM-DD)
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Type guard for NOAARainfallData
 * @param obj - Object to check
 * @returns True if the object is valid NOAARainfallData
 */
export function isNOAARainfallData(obj: any): obj is NOAARainfallData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check date property - must be a valid ISO date string
  if (typeof obj.date !== 'string' || !ISO_DATE_REGEX.test(obj.date)) {
    return false;
  }

  // Check PRCP property - must be a number representing precipitation in inches
  if (typeof obj.PRCP !== 'number' || isNaN(obj.PRCP) || obj.PRCP < 0) {
    return false;
  }

  // Check station property - must be a non-empty string
  if (typeof obj.station !== 'string' || obj.station.trim() === '') {
    return false;
  }

  // Check optional name property if present
  if (obj.name !== undefined && (typeof obj.name !== 'string' || obj.name.trim() === '')) {
    return false;
  }

  return true;
}

/**
 * Type guard for RainfallStation
 * @param obj - Object to check
 * @returns True if the object is a valid RainfallStation
 */
export function isRainfallStation(obj: any): obj is RainfallStation {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check id property
  if (typeof obj.id !== 'string' || obj.id.trim() === '') {
    return false;
  }

  // Check name property
  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    return false;
  }

  // Check lat property - must be a valid latitude
  if (typeof obj.lat !== 'number' || isNaN(obj.lat) || obj.lat < -90 || obj.lat > 90) {
    return false;
  }

  // Check lng property - must be a valid longitude
  if (typeof obj.lng !== 'number' || isNaN(obj.lng) || obj.lng < -180 || obj.lng > 180) {
    return false;
  }

  // Check optional distance property if present
  if (obj.distance !== undefined && typeof obj.distance !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard for NOAARainfallResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAARainfallResponse
 */
export function isNOAARainfallResponse(obj: any): obj is NOAARainfallResponse {
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

    // For non-empty arrays, check a sample of data entries (up to 5)
    const samplesToCheck = Math.min(5, obj.data.length);

    for (let i = 0; i < samplesToCheck; i++) {
      const index = obj.data.length <= 5 ? i : Math.floor(Math.random() * obj.data.length);
      if (!isNOAARainfallData(obj.data[index])) {
        return false;
      }
    }
  }

  // Check error property if present
  if (obj.error !== undefined) {
    if (
      !obj.error ||
      typeof obj.error !== 'object' ||
      typeof obj.error.message !== 'string' ||
      obj.error.message.trim() === ''
    ) {
      return false;
    }
  }

  return true;
}
