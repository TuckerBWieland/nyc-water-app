/**
 * GeoJSON type definitions for water quality samples
 *
 * This module provides TypeScript interfaces and type guards for GeoJSON data
 * used in the NYC Water App. It includes definitions for GeoJSON features,
 * collections, and sample data in both GeoJSON and non-GeoJSON formats.
 */
/**
 * GeoJSON Feature for water samples.
 * Represents a single water sample location with quality data.
 */
export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    [key: string]: any;
    site: string;
    mpn: string | number;
    sampleTime?: string;
    timestamp?: string;
    tideSummary?: string | null;
  };
}
/**
 * GeoJSON Collection of water samples.
 * Contains multiple water sample features.
 */
export interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}
/**
 * Sample data in regular JSON format (non-GeoJSON).
 * Alternative representation of water samples that doesn't follow GeoJSON spec.
 */
export interface SampleData {
  [key: string]: any;
  site: string;
  mpn: string | number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  sampleTime?: string;
  timestamp?: string;
  tideSummary?: string | null;
}
/**
 * Basic interface for data fetch result
 */
export interface FetchResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}
/**
 * Type guard to check if an object is a GeoJSON coordinates array
 */
export declare function isGeoJSONCoordinates(coordinates: any): coordinates is number[];
/**
 * Type guard to check if an object is a GeoJSON geometry object
 */
export declare function isGeoJSONGeometry(geometry: any): boolean;
/**
 * Type guard to check if an object conforms to GeoJSONFeature interface
 */
export declare function isGeoJSONFeature(obj: any): obj is GeoJSONFeature;
/**
 * Type guard to check if an object conforms to GeoJSONCollection interface
 */
export declare function isGeoJSONCollection(obj: any): obj is GeoJSONCollection;
/**
 * Type guard to check if an object conforms to SampleData interface
 */
export declare function isSampleData(obj: any): obj is SampleData;
