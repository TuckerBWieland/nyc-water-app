import type { TideStation, TideReading, TideStatus } from '../src/types/tide';
/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 *
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in kilometers
 */
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Formats a Date object for NOAA CO-OPS API (yyyy-MM-dd HH:mm)
 *
 * @param date - Date to format
 * @returns Formatted date string in NOAA API format
 */
export declare function formatDate(date: Date): string;
/**
 * Finds the nearest NOAA tide station within configurable distance of the given lat/lon
 *
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @returns Promise resolving to nearest station or null if none found
 */
export declare function findNearestTideStation(lat: number, lon: number): Promise<TideStation | null>;
/**
 * Helper function to find the nearest station within a given radius
 *
 * @param stations - Array of NOAA stations
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @param maxDistanceKm - Maximum distance to search within
 * @returns Nearest station or null if none found
 */
export declare function findNearestStationWithinRadius(stations: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    [key: string]: any;
}>, lat: number, lon: number, maxDistanceKm: number): TideStation | null;
/**
 * Gets tide data for a specific station around a specific time
 *
 * @param stationId - NOAA station ID
 * @param sampleTime - Time of the water sample
 * @returns Promise resolving to array of tide readings or null if error
 */
export declare function getTideData(stationId: string, sampleTime: string | Date): Promise<TideReading[] | null>;
/**
 * Determines tide status by analyzing tide data points
 *
 * @param tideData - Array of tide data points from NOAA
 * @param sampleDate - Date object representing the sample time
 * @returns Object with tide status information or null if analysis fails
 */
export declare function determineTideStatus(tideData: TideReading[], sampleDate: Date): TideStatus | null;
/**
 * Analyzes tide data and formats a tide summary string
 *
 * @param tideData - Array of tide readings
 * @param stationName - Name of the tide station
 * @param sampleTime - Time of the water sample
 * @returns Formatted tide summary string or null if analysis fails
 */
export declare function analyzeTideData(tideData: TideReading[], stationName: string, sampleTime: string | Date): string | null;
