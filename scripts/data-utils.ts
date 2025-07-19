import * as fs from 'fs'
import * as path from 'path'

/**
 * Check if data for a specific date has already been processed
 * @param outputDir - The output directory containing processed data
 * @param date - The date string in YYYY-MM-DD format
 * @returns True if the data has been processed, false otherwise
 */
export function isDateProcessed(outputDir: string, date: string): boolean {
  const geojsonFile = path.join(outputDir, date, 'enriched.geojson')
  return fs.existsSync(geojsonFile)
}

/**
 * Remove previously processed data for a specific date
 * @param outputDir - The output directory containing processed data
 * @param date - The date string in YYYY-MM-DD format
 */
export function removeProcessedData(outputDir: string, date: string): void {
  const dir = path.join(outputDir, date)
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch (err) {
    console.warn(`⚠️  Failed to remove existing data for ${date}:`, err)
  }
} 