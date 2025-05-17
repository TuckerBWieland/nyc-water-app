/**
 * GeoJSON type definitions for water quality samples
 *
 * This module provides TypeScript interfaces and type guards for GeoJSON data
 * used in the NYC Water App. It includes definitions for GeoJSON features,
 * collections, and sample data in both GeoJSON and non-GeoJSON formats.
 *
 * @module types/geojson
 */
/**
 * GeoJSON Feature for water samples.
 * Represents a single water sample location with quality data.
 *
 * @interface GeoJSONFeature
 * @property {string} type - Always "Feature" for GeoJSON features
 * @property {Object} geometry - Spatial geometry information
 * @property {string} geometry.type - Type of geometry (usually "Point" for samples)
 * @property {number[]} geometry.coordinates - [longitude, latitude] coordinates
 * @property {Object} properties - Properties of the water sample
 * @property {string} properties.site - Name of the sampling site
 * @property {string|number} properties.mpn - MPN (Most Probable Number) value indicating bacteria level
 * @property {string} [properties.sampleTime] - Time when sample was collected
 * @property {string} [properties.timestamp] - Alternative timestamp format
 * @property {string|null} [properties.tideSummary] - Tide conditions at sample time
 * @property {number|null} [properties.rainfall_mm_7day] - 7-day rainfall total in mm
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
    rainfall_mm_7day?: number | null;
  };
}
/**
 * GeoJSON Collection of water samples.
 * Contains multiple water sample features.
 *
 * @interface GeoJSONCollection
 * @property {string} type - Always "FeatureCollection" for GeoJSON collections
 * @property {GeoJSONFeature[]} features - Array of water sample features
 */
export interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}
/**
 * Sample data in regular JSON format (non-GeoJSON).
 * Alternative representation of water samples that doesn't follow GeoJSON spec.
 *
 * @interface SampleData
 * @property {number} [latitude] - Latitude coordinate
 * @property {number} [longitude] - Longitude coordinate
 * @property {number} [lat] - Alternative latitude name
 * @property {number} [lon] - Alternative longitude name
 * @property {string} site - Name of the sampling site
 * @property {string|number} mpn - MPN (Most Probable Number) value indicating bacteria level
 * @property {string} [sampleTime] - Time when sample was collected
 * @property {string} [timestamp] - Alternative timestamp format
 * @property {string|null} [tideSummary] - Tide conditions at sample time
 * @property {number|null} [rainfall_mm_7day] - 7-day rainfall total in mm
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
  rainfall_mm_7day?: number | null;
}
/**
 * Type guard to check if an object is a GeoJSON coordinates array
 * @param coordinates - Value to check
 * @returns True if the value is a valid GeoJSON coordinates array
 */
export declare function isGeoJSONCoordinates(coordinates: any): coordinates is number[];
/**
 * Type guard to check if an object is a GeoJSON geometry object
 * @param geometry - Object to check
 * @returns True if the object is a valid GeoJSON geometry object
 */
export declare function isGeoJSONGeometry(geometry: any): boolean;
/**
 * Type guard to check if an object conforms to GeoJSONFeature interface
 * @param obj - Object to check
 * @returns True if the object is a valid GeoJSONFeature
 */
export declare function isGeoJSONFeature(obj: any): obj is GeoJSONFeature;
/**
 * Type guard to check if an object conforms to GeoJSONCollection interface
 * @param obj - Object to check
 * @returns True if the object is a valid GeoJSONCollection
 */
export declare function isGeoJSONCollection(obj: any): obj is GeoJSONCollection;
/**
 * Type guard to check if an object conforms to SampleData interface
 * @param obj - Object to check
 * @returns True if the object is valid SampleData
 */
export declare function isSampleData(obj: any): obj is SampleData;
