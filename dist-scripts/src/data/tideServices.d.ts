/**
 * Tide data services for the NYC Water Quality App
 *
 * This module provides functions to work with NOAA tide data,
 * including finding the nearest tide station, fetching tide data,
 * and analyzing tide status.
 */
/**
 * Interface for tide station data
 */
export interface TideStation {
    id: string;
    name: string;
    lat: number;
    lon: number;
    state?: string;
}
/**
 * Interface for tide prediction data
 */
export interface TidePrediction {
    time: string;
    height: number;
    type: 'H' | 'L';
}
/**
 * Find the nearest tide station to given coordinates
 * @param lat - Latitude of the location
 * @param lon - Longitude of the location
 * @returns The nearest tide station or null if none found
 */
export declare function findNearestTideStation(lat: number, lon: number): Promise<TideStation | null>;
/**
 * Format a date in ISO format with consistent timezone handling
 * @param date - Date to format
 * @returns Formatted date string
 */
export declare function formatDate(date: Date): string;
/**
 * Get tide data for a specific station and time
 * @param stationId - NOAA station ID
 * @param dateTime - Date and time to get tide data for
 * @returns Array of tide predictions or null if error
 */
export declare function getTideData(stationId: string, dateTime: string): Promise<TidePrediction[] | null>;
/**
 * Analyze tide data to determine tide status at sample time
 * @param tides - Array of tide predictions
 * @param stationName - Name of the tide station
 * @param sampleTime - Time the sample was taken
 * @returns Tide status summary or null if unable to determine
 */
export declare function analyzeTideData(tides: TidePrediction[], stationName: string, sampleTime: string): string | null;
