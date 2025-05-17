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
    t: string;
    v: string;
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
    state: string;
    isRising: boolean;
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
export declare function isTideStation(obj: any): obj is TideStation;
/**
 * Type guard for TideReading
 * @param obj - Object to check
 * @returns True if the object is a valid TideReading
 */
export declare function isTideReading(obj: any): obj is TideReading;
/**
 * Type guard for ProcessedTideReading
 * @param obj - Object to check
 * @returns True if the object is a valid ProcessedTideReading
 */
export declare function isProcessedTideReading(obj: any): obj is ProcessedTideReading;
/**
 * Type guard for TideStatus
 * @param obj - Object to check
 * @returns True if the object is a valid TideStatus
 */
export declare function isTideStatus(obj: any): obj is TideStatus;
/**
 * Type guard for NOAAStationsResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAAStationsResponse
 */
export declare function isNOAAStationsResponse(obj: any): obj is NOAAStationsResponse;
/**
 * Type guard for NOAAWaterLevelResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAAWaterLevelResponse
 */
export declare function isNOAAWaterLevelResponse(obj: any): obj is NOAAWaterLevelResponse;
