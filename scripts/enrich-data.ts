// TypeScript version of enrich-data.js with enhanced type safety and validation
import * as fs from 'fs'
import * as path from 'path'

import type {
  DateFiles,
  ProcessingStats,
  EnrichedGeoJSON,
  EnrichedFeature,
  DatasetMetadata,
  ProcessedSample,
  ProcessedRainfall,
  TideEnrichment,
  ValidationResult,
  SampleCsvRow,
  RainCsvRow
} from './enrich-data-types'
import {
  parseRainCsv,
  parseSampleCsv,
  processRainfallData,
  processSampleRow,
  readAndParseCsv,
  createProcessingError
} from './enrich-data-utils'
import {
  findNearestTideStation,
  getTideData,
  analyzeTideData
} from './tide-services'
import { extractDateFromFilename } from './parsing-utils'
import { isDateProcessed, removeProcessedData } from './data-utils'
import { getQualityBucket, loadHistoricalCounts, type QualityCounts } from './quality-utils'

// Constants with explicit typing
const INPUT_DIR: string = './scripts/input/'
const OUTPUT_DIR: string = './public/data'

/**
 * Find and process sample-rain file pairs
 * Main entry point for data processing pipeline
 */
async function processDatasets(): Promise<void> {
  try {
    // Get all files in input directory
    const files = fs.readdirSync(INPUT_DIR)

    // Group files by date with proper typing
    const dateMap = new Map<string, DateFiles>()
    let latestDate: string | null = null

    files.forEach((file: string) => {
      const date = extractDateFromFilename(file)
      if (!date) return // Skip files without a date

      // Track latest date
      if (!latestDate || date > latestDate) {
        latestDate = date
      }

      // Group by date
      if (!dateMap.has(date)) {
        dateMap.set(date, { samples: null, rain: null })
      }

      // Categorize as sample or rain file
      const fileData = dateMap.get(date)!
      if (file.toLowerCase().includes('sample')) {
        fileData.samples = file
      } else if (file.toLowerCase().includes('rain')) {
        fileData.rain = file
      }
    })

    // Remove any existing processed data so we can overwrite with new files
    Array.from(dateMap.keys()).forEach(date => {
      if (isDateProcessed(OUTPUT_DIR, date)) {
        console.warn(`⚠️  Data for ${date} already exists and will be overwritten.`)
        removeProcessedData(OUTPUT_DIR, date)
      }
    })

    // Process each date that has both sample and rain files
    let processedDates = 0

    // Load existing history counts after cleaning any overwritten dates
    const historyCounts: Map<string, QualityCounts> = loadHistoricalCounts(OUTPUT_DIR)

    for (const entry of Array.from(dateMap.entries())) {
      const [date, files] = entry
      if (files.samples && files.rain) {
        const success = await processDateFiles(date, files.samples, files.rain, historyCounts)
        if (success) {
          processedDates++
          try {
            fs.unlinkSync(path.join(INPUT_DIR, files.samples))
            fs.unlinkSync(path.join(INPUT_DIR, files.rain))
          } catch (err) {
            console.warn(`⚠️  Could not delete input files for ${date}:`, err)
          }
        }
      } else {
        console.warn(
          `Incomplete data for ${date}: samples=${files.samples ? 'Yes' : 'No'}, rain=${files.rain ? 'Yes' : 'No'}`
        )
      }
    }

    // Update latest.txt if we processed any dates
    if (latestDate && processedDates > 0) {
      fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.txt'), latestDate)
    } else {
      console.warn('⚠️ No complete data sets found. No files processed.')
    }

    // Always update dates.json to reflect available datasets
    try {
      const dirs = fs
        .readdirSync(OUTPUT_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
        .map(d => d.name)
        .sort()
      
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'dates.json'),
        JSON.stringify(dirs, null, 2)
      )
    } catch (err) {
      console.warn('⚠️ Failed to update dates.json:', err)
    }

  } catch (error) {
    const processingError = createProcessingError(
      `Failed to process datasets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FILE_READ_ERROR'
    )
    throw processingError
  }
}

/**
 * Process a single date's sample and rain files with comprehensive validation
 * @param date - Date in YYYY-MM-DD format
 * @param sampleFile - Sample file name
 * @param rainFile - Rain file name
 * @param historyCounts - Historical quality counts map
 * @returns Promise resolving to success status
 */
async function processDateFiles(
  date: string,
  sampleFile: string,
  rainFile: string,
  historyCounts: Map<string, QualityCounts>
): Promise<boolean> {
  try {
    console.log(`📊 Processing data for ${date}...`)

    // Read and validate CSV files
    const sampleResult: ValidationResult<SampleCsvRow[]> = await readAndParseCsv(
      path.join(INPUT_DIR, sampleFile),
      parseSampleCsv
    )

    const rainResult: ValidationResult<RainCsvRow[]> = await readAndParseCsv(
      path.join(INPUT_DIR, rainFile),
      parseRainCsv
    )

    // Check for validation errors
    if (!sampleResult.isValid) {
      console.error(`❌ Sample file validation failed for ${date}:`)
      sampleResult.errors.forEach(error => console.error(`  - ${error}`))
      return false
    }

    if (!rainResult.isValid) {
      console.error(`❌ Rain file validation failed for ${date}:`)
      rainResult.errors.forEach(error => console.error(`  - ${error}`))
      return false
    }

    // Process rainfall data
    const rainfallData: ProcessedRainfall = processRainfallData(rainResult.data!)

    // Process sample points with detailed statistics
    const features: EnrichedFeature[] = []
    const stats: ProcessingStats = {
      totalSites: sampleResult.data!.length,
      skipped: 0,
      skippedLatLng: 0,
      skippedMpn: 0,
      processed: 0
    }

    for (let index = 0; index < sampleResult.data!.length; index++) {
      const sampleRow = sampleResult.data![index]
      try {
        // Validate and process sample row
        const processedSample: ProcessedSample | null = processSampleRow(sampleRow, date)
        
        if (!processedSample) {
          stats.skipped++
          // Determine specific reason for skipping
          if (!sampleRow['Latitude'] || !sampleRow['Longitude']) {
            stats.skippedLatLng++
          }
          if (!sampleRow['MPN']) {
            stats.skippedMpn++
          }
          continue
        }

        // Create base feature
        const feature: EnrichedFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [processedSample.longitude, processedSample.latitude],
          },
          properties: {
            siteName: processedSample.siteName,
            mpn: processedSample.mpnValue,
            timestamp: processedSample.isoTimestamp,
            sampleTime: processedSample.isoTimestamp, // Legacy field
            rainByDay: rainfallData.rainByDay,
            totalRain: rainfallData.totalRain,
            rainfall_mm_7day: rainfallData.rainfall_mm_7day,
            tideHeight: 'N/A',
            tideState: 'Tide info unavailable',
            tide: 'Tide info unavailable',
            goodCount: 0,
            cautionCount: 0,
            poorCount: 0
          },
        }

        // Enrich with tide data
        const tideEnrichment = await enrichWithTideData(
          processedSample.latitude,
          processedSample.longitude,
          processedSample.isoTimestamp
        )
        
        Object.assign(feature.properties, tideEnrichment)

        // Update historical quality counts
        if (!historyCounts.has(processedSample.siteName)) {
          historyCounts.set(processedSample.siteName, { good: 0, caution: 0, poor: 0 })
        }
        
        const bucket = getQualityBucket(processedSample.mpnValue)
        const siteCounts = historyCounts.get(processedSample.siteName)!
        siteCounts[bucket]++

        // Add historical counts to feature
        feature.properties.goodCount = siteCounts.good
        feature.properties.cautionCount = siteCounts.caution
        feature.properties.poorCount = siteCounts.poor

        features.push(feature)
        stats.processed++

      } catch (error) {
        console.warn(`⚠️  Failed to process sample ${index + 1}:`, error)
        stats.skipped++
      }
    }

    // Log processing statistics
    console.log(`📈 Processing complete for ${date}:`)
    console.log(`  - Total sites: ${stats.totalSites}`)
    console.log(`  - Processed: ${stats.processed}`)
    console.log(`  - Skipped: ${stats.skipped} (${stats.skippedLatLng} missing coordinates, ${stats.skippedMpn} missing MPN)`)

    // Create output directory if it doesn't exist
    const outputPath = path.join(OUTPUT_DIR, date)
    fs.mkdirSync(outputPath, { recursive: true })

    // Write enriched GeoJSON with custom formatting
    const geojson: EnrichedGeoJSON = {
      type: 'FeatureCollection',
      features,
    }
    
    // Custom JSON formatting to keep arrays compact while maintaining readability
    const jsonString = JSON.stringify(geojson, null, 2)
      .replace(/\[\s*([^\[\]]*?)\s*\]/g, (match, content) => {
        // Only compact arrays that don't contain objects or nested arrays
        if (!content.includes('{') && !content.includes('[')) {
          return `[${content.replace(/\s+/g, ' ').trim()}]`
        }
        return match
      })
    
    fs.writeFileSync(path.join(outputPath, 'enriched.geojson'), jsonString)

    // Write metadata
    const metadata: DatasetMetadata = {
      date,
      totalRain: rainfallData.totalRain,
      sampleCount: features.length,
      description: `Water quality samples from ${date}`,
    }
    fs.writeFileSync(path.join(outputPath, 'metadata.json'), JSON.stringify(metadata, null, 2))

    console.log(`✅ Successfully processed ${date}: ${features.length} samples`)
    return true

  } catch (err) {
    const error = createProcessingError(
      `Error processing ${date}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'FILE_WRITE_ERROR',
      { filename: `${date} dataset` }
    )
    console.error(`❌ ${error.message}`)
    return false
  }
}

/**
 * Enrich sample with tide data from NOAA API
 * @param latitude - Sample latitude
 * @param longitude - Sample longitude  
 * @param timestamp - Sample timestamp
 * @returns Tide enrichment data
 */
async function enrichWithTideData(
  latitude: number,
  longitude: number,
  timestamp: string
): Promise<TideEnrichment> {
  try {
    const station = await findNearestTideStation(latitude, longitude)
    
    if (!station) {
      return {
        tideHeight: 'No tide station nearby',
        tideState: 'Tide info unavailable',
        tide: 'Tide info unavailable'
      }
    }

    const { height, predictions } = await getTideData(station.id, timestamp)
    
    const tideHeight = height === 'N/A' ? 'N/A' : `${height} ft`
    const tideSummary = analyzeTideData(predictions, station.name, timestamp)
    const tideState = tideSummary || 'Tide info unavailable'

    return {
      tideHeight,
      tideState,
      tide: tideState
    }

  } catch (err) {
    console.warn('Tide enrichment failed:', err)
    return {
      tideHeight: 'N/A',
      tideState: 'Tide info unavailable',
      tide: 'Tide info unavailable'
    }
  }
}

// Main execution with proper error handling
(async (): Promise<void> => {
  try {
    await processDatasets()
    console.log('🎉 Data enrichment completed successfully!')
  } catch (err) {
    console.error('❌ Error in enrichment process:', err)
    process.exit(1)
  }
})() 