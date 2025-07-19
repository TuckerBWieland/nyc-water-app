// TypeScript interfaces for NYC Water Quality Data Processing
// Based on real CSV samples from the application

// =============================================================================
// RAW CSV DATA TYPES
// =============================================================================

/**
 * Raw rain CSV row as parsed by Papa Parse
 * Headers: "data,rainfall" (note: 'data' not 'date')
 */
export interface RainCsvRow {
  data: string       // Date string in M/D/YYYY format (e.g., "7/10/2025")
  rainfall: string   // Rainfall amount as string (e.g., "0.18", "0")
}

/**
 * Raw sample CSV row as parsed by Papa Parse
 * Headers: "Site Name,Latitude,Longitude,Sample Time,MPN"
 * All fields come as strings and may be empty
 */
export interface SampleCsvRow {
  'Site Name': string    // Quoted site name (e.g., "Hudson River, JFK Marina (Yonkers)")
  'Latitude': string     // Latitude as string (e.g., "40.956632") or empty
  'Longitude': string    // Longitude as string (e.g., "-73.897690") or empty  
  'Sample Time': string  // Time format varies: "9:02", "1:14 PM", "11:20 AM", or empty
  'MPN': string         // MPN value: number, "<10", empty string
}

// =============================================================================
// PROCESSED DATA TYPES
// =============================================================================

/**
 * Processed rainfall data from CSV
 */
export interface ProcessedRainfall {
  rainByDay: number[]      // Array of daily rainfall values (last 7 days)
  totalRain: number        // Total rainfall in inches
  rainfall_mm_7day: number // Total rainfall converted to millimeters
}

/**
 * Validated and processed sample data
 */
export interface ProcessedSample {
  siteName: string
  latitude: number
  longitude: number
  mpnValue: number
  sampleTime: string
  isoTimestamp: string
}

/**
 * Tide enrichment data from NOAA API
 */
export interface TideEnrichment {
  tideHeight: string    // e.g., "3.42 ft", "N/A", "No tide station nearby"
  tideState: string     // e.g., "High Tide – ⬆️ Rising (Battery Park)"
  tide: string          // Same as tideState for backward compatibility
}

/**
 * Historical quality counts for a site
 */
export interface QualityHistory {
  goodCount: number
  cautionCount: number
  poorCount: number
}

// =============================================================================
// GEOJSON OUTPUT TYPES
// =============================================================================

/**
 * Properties for enriched GeoJSON features
 * This matches the output structure in the existing enriched.geojson files
 */
export interface EnrichedFeatureProperties {
  siteName: string
  mpn: number
  timestamp: string
  sampleTime?: string           // Legacy field, same as timestamp
  rainByDay: number[]
  totalRain: number
  rainfall_mm_7day: number
  tideHeight: string
  tideState: string
  tide: string                  // Same as tideState
  goodCount: number
  cautionCount: number
  poorCount: number
}

/**
 * GeoJSON feature for water quality sample
 */
export interface EnrichedFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: EnrichedFeatureProperties
}

/**
 * Complete enriched GeoJSON structure
 */
export interface EnrichedGeoJSON {
  type: 'FeatureCollection'
  features: EnrichedFeature[]
}

/**
 * Metadata file structure
 */
export interface DatasetMetadata {
  date: string
  totalRain: number
  sampleCount: number
  description: string
}

// =============================================================================
// FILE PROCESSING TYPES
// =============================================================================

/**
 * File grouping by date
 */
export interface DateFiles {
  samples: string | null
  rain: string | null
}

/**
 * Processing statistics and results
 */
export interface ProcessingStats {
  totalSites: number
  skipped: number
  skippedLatLng: number
  skippedMpn: number
  processed: number
}

/**
 * Data processing options
 */
export interface ProcessingOptions {
  inputDir: string
  outputDir: string
  overwrite?: boolean
  enableTideData?: boolean
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Validation result for CSV data
 */
export interface ValidationResult<T> {
  isValid: boolean
  data?: T
  errors: string[]
}

/**
 * MPN parsing result (handles special cases like "<10")
 */
export interface MPNParseResult {
  value: number
  isDetectionLimit: boolean
  originalString: string
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Data processing error with context
 */
export interface ProcessingError extends Error {
  code: 'CSV_PARSE_ERROR' | 'FILE_READ_ERROR' | 'VALIDATION_ERROR' | 'TIDE_API_ERROR' | 'FILE_WRITE_ERROR'
  context?: {
    filename?: string
    rowIndex?: number
    fieldName?: string
  }
}

/**
 * CSV validation error details
 */
export interface CSVValidationError {
  row: number
  field: string
  value: string
  message: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Papa Parse configuration for consistent CSV parsing
 */
export interface CSVParseConfig {
  header: true
  skipEmptyLines: boolean
  transformHeader?: (header: string) => string
}

/**
 * Date string in YYYY-MM-DD format
 */
export type DateString = string

/**
 * Tide station information from NOAA
 */
export interface TideStation {
  id: string
  name: string
  latitude: number
  longitude: number
  distance: number // Distance from sample site in km
} 