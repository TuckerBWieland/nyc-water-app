import * as fs from 'fs'
import * as path from 'path'

// Quality assessment constants
const MPN_THRESHOLD_LOW = 35
const MPN_THRESHOLD_MEDIUM = 104

// Type definitions
export type QualityBucket = 'good' | 'caution' | 'poor'

export interface QualityCounts {
  good: number
  caution: number
  poor: number
}

export interface WaterQualityFeature {
  properties?: {
    siteName?: string
    mpn?: number | null
  }
}

export interface WaterQualityData {
  features?: WaterQualityFeature[]
}

/**
 * Determine quality bucket based on MPN value
 * @param mpn - Most Probable Number value
 * @returns Quality assessment bucket
 */
export function getQualityBucket(mpn: number): QualityBucket {
  if (mpn < MPN_THRESHOLD_LOW) return 'good'
  if (mpn <= MPN_THRESHOLD_MEDIUM) return 'caution'
  return 'poor'
}

/**
 * Load historical quality counts for all sites from processed data
 * @param outputDir - Directory containing processed data folders
 * @returns Map of site names to their historical quality counts
 */
export function loadHistoricalCounts(outputDir: string): Map<string, QualityCounts> {
  const counts = new Map<string, QualityCounts>()
  
  if (!fs.existsSync(outputDir)) return counts

  const dirs = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
    .map(d => d.name)

  for (const dir of dirs) {
    const file = path.join(outputDir, dir, 'enriched.geojson')
    if (!fs.existsSync(file)) continue
    
    try {
      const data: WaterQualityData = JSON.parse(fs.readFileSync(file, 'utf-8'))
      if (!data.features) continue
      
      for (const feature of data.features) {
        const props = feature.properties || {}
        const site = props.siteName
        const mpn = props.mpn
        
        if (!site || mpn === undefined || mpn === null) continue
        
        const bucket = getQualityBucket(Number(mpn))
        
        if (!counts.has(site)) {
          counts.set(site, { good: 0, caution: 0, poor: 0 })
        }
        
        const siteCounts = counts.get(site)!
        siteCounts[bucket]++
      }
    } catch (err) {
      console.warn(`Failed to load history from ${file}:`, err)
    }
  }

  return counts
} 