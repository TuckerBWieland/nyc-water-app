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
 * Type guard for TideStation
 * @param obj - Object to check
 * @returns True if the object is a valid TideStation
 */
export function isTideStation(obj) {
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
export function isTideReading(obj) {
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
export function isProcessedTideReading(obj) {
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
export function isTideStatus(obj) {
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
export function isNOAAStationsResponse(obj) {
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
export function isNOAAWaterLevelResponse(obj) {
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
