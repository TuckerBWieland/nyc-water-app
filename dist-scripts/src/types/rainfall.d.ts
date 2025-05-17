/**
 * Rainfall data type definitions
 */
/**
 * NOAA rainfall data
 */
export interface NOAARainfallData {
  date: string;
  PRCP: number;
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
 * Type guard for NOAARainfallData
 * @param obj - Object to check
 * @returns True if the object is valid NOAARainfallData
 */
export declare function isNOAARainfallData(obj: any): obj is NOAARainfallData;
/**
 * Type guard for RainfallStation
 * @param obj - Object to check
 * @returns True if the object is a valid RainfallStation
 */
export declare function isRainfallStation(obj: any): obj is RainfallStation;
/**
 * Type guard for NOAARainfallResponse
 * @param obj - Object to check
 * @returns True if the object is a valid NOAARainfallResponse
 */
export declare function isNOAARainfallResponse(obj: any): obj is NOAARainfallResponse;
