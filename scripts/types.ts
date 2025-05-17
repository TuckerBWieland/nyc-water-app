/**
 * Type definitions for NYC Water App scripts
 */

/**
 * NOAA Tide Station information
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
 */
export interface TideReading {
  t: string; // timestamp in format YYYY-MM-DD HH:MM
  v: string; // water level value as string
}

/**
 * Processed tide reading with parsed date and numeric value
 */
export interface ProcessedTideReading {
  time: Date;
  height: number;
}

/**
 * Analyzed tide status information
 */
export interface TideStatus {
  state: string; // 'High Tide', 'Low Tide', or 'Mid Tide'
  isRising: boolean; // Whether the tide is rising or falling
  currentHeight: number;
  minHeight: number;
  maxHeight: number;
}

/**
 * GeoJSON Feature for water samples
 */
export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    [key: string]: any;
    sampleTime?: string;
    timestamp?: string;
    tideSummary?: string | null;
  };
}

/**
 * GeoJSON Collection of water samples
 */
export interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

/**
 * Sample data in regular JSON format (non-GeoJSON)
 */
export interface SampleData {
  [key: string]: any;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  sampleTime?: string;
  timestamp?: string;
  tideSummary?: string | null;
}

/**
 * NOAA Station API response
 */
export interface NOAAStationsResponse {
  stations: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }[];
}

/**
 * NOAA Water Level API response
 */
export interface NOAAWaterLevelResponse {
  data?: TideReading[];
  error?: {
    message: string;
  };
}
