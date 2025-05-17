import type { RainfallStation } from '../src/types/rainfall';
/**
 * Finds the nearest NOAA rainfall station within configurable distance of the given lat/lon
 *
 * @param lat - Latitude to search near
 * @param lon - Longitude to search near
 * @returns Promise resolving to nearest station or null if none found
 */
export declare function findNearestRainfallStation(lat: number, lon: number): Promise<RainfallStation | null>;
/**
 * Helper function to find the nearest station within a given radius
 *
 * @param stations - Array of rainfall stations
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
}>, lat: number, lon: number, maxDistanceKm: number): RainfallStation | null;
/**
 * Format date as YYYY-MM-DD
 *
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export declare function formatDateForRainfall(date: Date): string;
/**
 * Gets 7-day rainfall data ending on the specified date
 * Note: This implementation is kept for reference but we're using Open-Meteo
 * since it doesn't require API keys
 *
 * @param stationId - NOAA station ID
 * @param sampleDate - End date for the 7-day period (usually the sample date)
 * @returns Promise resolving to 7-day total rainfall in mm or null if data unavailable
 */
export declare function get7DayRainfallTotal(stationId: string, sampleDate: string | Date): Promise<number | null>;
/**
 * Gets 7-day rainfall data using Open-Meteo historical API (alternative to NOAA)
 *
 * @param lat - Latitude of the sample location
 * @param lon - Longitude of the sample location
 * @param sampleDate - End date for the 7-day period (usually the sample date)
 * @returns Promise resolving to 7-day total rainfall in mm or null if data unavailable
 */
export declare function getOpen7DayRainfallTotal(lat: number, lon: number, sampleDate: string | Date): Promise<number | null>;
