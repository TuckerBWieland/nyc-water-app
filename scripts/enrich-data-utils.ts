// Utility functions for data validation and parsing in the enrich-data script
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import type {
  RainCsvRow,
  SampleCsvRow,
  ProcessedRainfall,
  ProcessedSample,
  ValidationResult,
  MPNParseResult,
  CSVValidationError,
  ProcessingError,
  CSVParseConfig
} from './enrich-data-types'

// =============================================================================
// CSV PARSING UTILITIES
// =============================================================================

/**
 * Parse rainfall CSV with validation
 * @param csvData - Raw CSV string content
 * @returns Parsed and validated rainfall data
 */
export function parseRainCsv(csvData: string): ValidationResult<RainCsvRow[]> {
  const errors: string[] = []
  
  try {
    const config: CSVParseConfig = {
      header: true,
      skipEmptyLines: true
    }
    
    const result = Papa.parse<RainCsvRow>(csvData.trim(), config)
    
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((e: any) => `CSV Parse Error: ${e.message}`))
    }
    
    // Validate data structure
    if (!result.data || result.data.length === 0) {
      errors.push('No rainfall data found in CSV')
      return { isValid: false, errors }
    }
    
    // Check for required columns
    const firstRow = result.data[0]
    if (!('data' in firstRow) || !('rainfall' in firstRow)) {
      errors.push('Missing required columns. Expected: "data,rainfall"')
      return { isValid: false, errors }
    }
    
    // Validate each row
    const validRows: RainCsvRow[] = []
    result.data.forEach((row: RainCsvRow, index: number) => {
      const rowErrors = validateRainRow(row, index)
      if (rowErrors.length > 0) {
        errors.push(...rowErrors.map((e: CSVValidationError) => `Row ${index + 2}: ${e.message}`))
      } else {
        validRows.push(row)
      }
    })
    
    if (validRows.length === 0) {
      errors.push('No valid rainfall data rows found')
      return { isValid: false, errors }
    }
    
    return {
      isValid: errors.length === 0,
      data: validRows,
      errors
    }
    
  } catch (error) {
    errors.push(`Failed to parse rainfall CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { isValid: false, errors }
  }
}

/**
 * Parse sample CSV with validation
 * @param csvData - Raw CSV string content
 * @returns Parsed and validated sample data
 */
export function parseSampleCsv(csvData: string): ValidationResult<SampleCsvRow[]> {
  const errors: string[] = []
  
  try {
    const config: CSVParseConfig = {
      header: true,
      skipEmptyLines: true
    }
    
    const result = Papa.parse<SampleCsvRow>(csvData.trim(), config)
    
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((e: any) => `CSV Parse Error: ${e.message}`))
    }
    
    // Validate data structure
    if (!result.data || result.data.length === 0) {
      errors.push('No sample data found in CSV')
      return { isValid: false, errors }
    }
    
    // Check for required columns
    const firstRow = result.data[0]
    const requiredColumns = ['Site Name', 'Latitude', 'Longitude', 'Sample Time', 'MPN']
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`)
      return { isValid: false, errors }
    }
    
    return {
      isValid: errors.length === 0,
      data: result.data,
      errors
    }
    
  } catch (error) {
    errors.push(`Failed to parse sample CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { isValid: false, errors }
  }
}

// =============================================================================
// DATA VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a rainfall CSV row
 */
function validateRainRow(row: RainCsvRow, index: number): CSVValidationError[] {
  const errors: CSVValidationError[] = []
  
  // Validate date field
  if (!row.data || row.data.trim() === '') {
    errors.push({
      row: index + 2, // +2 because Papa Parse is 0-indexed and CSV has header
      field: 'data',
      value: row.data || '',
      message: 'Date field is empty'
    })
  } else {
    // Basic date format validation (M/D/YYYY)
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/
    if (!datePattern.test(row.data.trim())) {
      errors.push({
        row: index + 2,
        field: 'data',
        value: row.data,
        message: 'Invalid date format. Expected M/D/YYYY (e.g., 7/10/2025)'
      })
    }
  }
  
  // Validate rainfall field
  if (!row.rainfall || row.rainfall.trim() === '') {
    errors.push({
      row: index + 2,
      field: 'rainfall',
      value: row.rainfall || '',
      message: 'Rainfall field is empty'
    })
  } else {
    const rainfallValue = parseFloat(row.rainfall.trim())
    if (isNaN(rainfallValue) || rainfallValue < 0) {
      errors.push({
        row: index + 2,
        field: 'rainfall',
        value: row.rainfall,
        message: 'Invalid rainfall value. Must be a non-negative number'
      })
    }
  }
  
  return errors
}

// =============================================================================
// DATA PROCESSING FUNCTIONS
// =============================================================================

/**
 * Process rainfall data from validated CSV rows
 * @param rainRows - Validated rainfall CSV rows
 * @returns Processed rainfall data
 */
export function processRainfallData(rainRows: RainCsvRow[]): ProcessedRainfall {
  // Extract rainfall values and take last 7 days
  const rainByDay = rainRows
    .map(row => parseFloat(row.rainfall))
    .filter(v => !Number.isNaN(v))
    .slice(-7) // Last 7 days
  
  const totalRain = rainByDay.reduce((sum, val) => sum + val, 0)
  
  // Convert from inches to millimeters (1 inch = 25.4 mm)
  const rainfall_mm_7day = totalRain * 25.4
  
  return {
    rainByDay,
    totalRain,
    rainfall_mm_7day
  }
}

/**
 * Parse MPN value handling special cases like "<10"
 * @param mpnString - Raw MPN string from CSV
 * @returns Parsed MPN result with metadata
 */
export function parseMPNValue(mpnString: string): MPNParseResult {
  const trimmed = mpnString.trim()
  
  // Handle empty values
  if (!trimmed) {
    return {
      value: NaN,
      isDetectionLimit: false,
      originalString: mpnString
    }
  }
  
  // Handle detection limit values like "<10"
  if (trimmed.startsWith('<')) {
    const numericPart = trimmed.substring(1)
    const value = parseFloat(numericPart)
    return {
      value: isNaN(value) ? NaN : value,
      isDetectionLimit: true,
      originalString: mpnString
    }
  }
  
  // Handle regular numeric values
  const value = parseFloat(trimmed)
  return {
    value,
    isDetectionLimit: false,
    originalString: mpnString
  }
}

/**
 * Validate and process a sample row
 * @param row - Raw sample CSV row
 * @param date - Date string for timestamp generation
 * @returns Processed sample data or null if invalid
 */
export function processSampleRow(row: SampleCsvRow, date: string): ProcessedSample | null {
  // Extract and validate required fields
  const siteName = row['Site Name']?.trim() || ''
  const latStr = row['Latitude']?.trim() || ''
  const lngStr = row['Longitude']?.trim() || ''
  const mpnStr = row['MPN']?.trim() || ''
  const sampleTime = row['Sample Time']?.trim() || ''
  
  // Validate site name
  if (!siteName) {
    return null
  }
  
  // Validate coordinates
  const latitude = parseFloat(latStr)
  const longitude = parseFloat(lngStr)
  if (isNaN(latitude) || isNaN(longitude)) {
    return null
  }
  
  // Validate MPN
  const mpnResult = parseMPNValue(mpnStr)
  if (isNaN(mpnResult.value)) {
    return null
  }
  
  // Generate ISO timestamp
  const isoTimestamp = generateISOTimestamp(date, sampleTime)
  
  return {
    siteName,
    latitude,
    longitude,
    mpnValue: mpnResult.value,
    sampleTime,
    isoTimestamp
  }
}

/**
 * Generate ISO timestamp from date and time strings
 * Uses the existing formatSampleTime logic
 */
function generateISOTimestamp(date: string, timeStr: string): string {
  // Import the existing formatSampleTime function
  // This maintains compatibility with existing logic
  const { formatSampleTime } = require('./parsing-utils.js')
  return formatSampleTime(date, timeStr)
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Safely read and parse CSV file
 * @param filePath - Path to CSV file
 * @param parser - Parser function (parseRainCsv or parseSampleCsv)
 * @returns Parsed data or error
 */
export async function readAndParseCsv<T>(
  filePath: string,
  parser: (csvData: string) => ValidationResult<T>
): Promise<ValidationResult<T>> {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        isValid: false,
        errors: [`File not found: ${filePath}`]
      }
    }
    
    const csvData = fs.readFileSync(filePath, 'utf-8')
    return parser(csvData)
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Create a ProcessingError with context
 */
export function createProcessingError(
  message: string,
  code: ProcessingError['code'],
  context?: ProcessingError['context']
): ProcessingError {
  const error = new Error(message) as ProcessingError
  error.code = code
  error.context = context
  return error
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if an object is a valid RainCsvRow
 */
export function isRainCsvRow(obj: any): obj is RainCsvRow {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.data === 'string' &&
         typeof obj.rainfall === 'string'
}

/**
 * Type guard to check if an object is a valid SampleCsvRow
 */
export function isSampleCsvRow(obj: any): obj is SampleCsvRow {
  return obj && 
         typeof obj === 'object' &&
         typeof obj['Site Name'] === 'string' &&
         typeof obj['Latitude'] === 'string' &&
         typeof obj['Longitude'] === 'string' &&
         typeof obj['Sample Time'] === 'string' &&
         typeof obj['MPN'] === 'string'
} 