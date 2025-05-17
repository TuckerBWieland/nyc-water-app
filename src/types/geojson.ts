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
export function isGeoJSONCoordinates(coordinates: any): coordinates is number[] {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates.every(coord => typeof coord === 'number' && !isNaN(coord))
  );
}

/**
 * Type guard to check if an object is a GeoJSON geometry object
 * @param geometry - Object to check
 * @returns True if the object is a valid GeoJSON geometry object
 */
export function isGeoJSONGeometry(geometry: any): boolean {
  return (
    geometry &&
    typeof geometry === 'object' &&
    typeof geometry.type === 'string' &&
    ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(
      geometry.type
    ) &&
    Array.isArray(geometry.coordinates) &&
    ((geometry.type === 'Point' && isGeoJSONCoordinates(geometry.coordinates)) ||
      (geometry.type !== 'Point' && Array.isArray(geometry.coordinates)))
  );
}

/**
 * Type guard to check if an object conforms to GeoJSONFeature interface
 * @param obj - Object to check
 * @returns True if the object is a valid GeoJSONFeature
 */
export function isGeoJSONFeature(obj: any): obj is GeoJSONFeature {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check feature type
  if (typeof obj.type !== 'string' || obj.type !== 'Feature') {
    return false;
  }

  // Check geometry
  if (!isGeoJSONGeometry(obj.geometry)) {
    return false;
  }

  // Check properties
  if (!obj.properties || typeof obj.properties !== 'object') {
    return false;
  }

  // Check required properties for our application
  const props = obj.properties;
  if (typeof props.site !== 'string' || props.site.trim() === '') {
    return false;
  }

  if (
    props.mpn === undefined ||
    props.mpn === null ||
    (typeof props.mpn !== 'string' && typeof props.mpn !== 'number')
  ) {
    return false;
  }

  // Optional properties have correct types if present
  if (props.sampleTime !== undefined && typeof props.sampleTime !== 'string') {
    return false;
  }

  if (props.timestamp !== undefined && typeof props.timestamp !== 'string') {
    return false;
  }

  if (
    props.tideSummary !== undefined &&
    props.tideSummary !== null &&
    typeof props.tideSummary !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object conforms to GeoJSONCollection interface
 * @param obj - Object to check
 * @returns True if the object is a valid GeoJSONCollection
 */
export function isGeoJSONCollection(obj: any): obj is GeoJSONCollection {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check collection type
  if (typeof obj.type !== 'string' || obj.type !== 'FeatureCollection') {
    return false;
  }

  // Check features array
  if (!Array.isArray(obj.features)) {
    return false;
  }

  // Empty collections are valid
  if (obj.features.length === 0) {
    return true;
  }

  // For non-empty collections, check a sample of features (up to 5)
  // This is a performance optimization for large collections
  const samplesToCheck = Math.min(5, obj.features.length);
  for (let i = 0; i < samplesToCheck; i++) {
    // Check random samples in larger collections
    const index = obj.features.length <= 5 ? i : Math.floor(Math.random() * obj.features.length);
    if (!isGeoJSONFeature(obj.features[index])) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard to check if an object conforms to SampleData interface
 * @param obj - Object to check
 * @returns True if the object is valid SampleData
 */
export function isSampleData(obj: any): obj is SampleData {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check coordinates (either lat/lon or latitude/longitude)
  const hasLatLon =
    typeof obj.lat === 'number' &&
    !isNaN(obj.lat) &&
    typeof obj.lon === 'number' &&
    !isNaN(obj.lon);

  const hasLatitudeLongitude =
    typeof obj.latitude === 'number' &&
    !isNaN(obj.latitude) &&
    typeof obj.longitude === 'number' &&
    !isNaN(obj.longitude);

  if (!hasLatLon && !hasLatitudeLongitude) {
    return false;
  }

  // Required properties - must have at least a site name
  if (typeof obj.site !== 'string' || obj.site.trim() === '') {
    return false;
  }

  // Optional properties have correct types if present
  if (obj.sampleTime !== undefined && typeof obj.sampleTime !== 'string') {
    return false;
  }

  if (obj.timestamp !== undefined && typeof obj.timestamp !== 'string') {
    return false;
  }

  if (
    obj.tideSummary !== undefined &&
    obj.tideSummary !== null &&
    typeof obj.tideSummary !== 'string'
  ) {
    return false;
  }

  return true;
}
