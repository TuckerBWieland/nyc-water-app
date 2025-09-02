import { ref, computed } from 'vue'
import type { DataMetadata } from '@/types'

export interface YearlyStats {
  totalSamples: number
  unsafeSamples: number
  safeSamples: number
  loading: boolean
  error: string | null
}

export function useYearlyStats() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const allMetadata = ref<DataMetadata[]>([])

  const stats = computed((): YearlyStats => {
    if (allMetadata.value.length === 0) {
      return {
        totalSamples: 0,
        unsafeSamples: 0,
        safeSamples: 0,
        loading: loading.value,
        error: error.value
      }
    }

    const totalSamples = allMetadata.value.reduce((sum, metadata) => sum + metadata.totalSites, 0)
    const unsafeSamples = allMetadata.value.reduce((sum, metadata) => sum + metadata.cautionSites + metadata.poorSites, 0)
    const safeSamples = allMetadata.value.reduce((sum, metadata) => sum + metadata.goodSites, 0)

    return {
      totalSamples,
      unsafeSamples,
      safeSamples,
      loading: loading.value,
      error: error.value
    }
  })

  const loadYearlyStats = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      // Load dates from the dates.json file
      const datesResponse = await fetch(`${import.meta.env.BASE_URL}data/dates.json`)
      if (!datesResponse.ok) {
        throw new Error('Failed to load dates')
      }
      const dates: string[] = await datesResponse.json()

      // Load metadata for each date
      const metadataPromises = dates.map(async (date) => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/${date}/metadata.json`)
          if (!response.ok) {
            throw new Error(`Failed to load metadata for ${date}`)
          }
          const metadata = await response.json()
          
          // Convert metadata to match DataMetadata interface
          return {
            date: metadata.date,
            totalSites: metadata.sampleCount || 0,
            goodSites: 0, // We'll need to calculate this from the actual data
            cautionSites: 0,
            poorSites: 0,
            lastUpdated: metadata.date
          } as DataMetadata
        } catch (err) {
          console.warn(`Failed to load metadata for ${date}:`, err)
          return null
        }
      })

      const results = await Promise.all(metadataPromises)
      const validMetadata = results.filter((metadata): metadata is DataMetadata => metadata !== null)

      // Now we need to load the actual GeoJSON data to get the safety counts
      const enrichedMetadataPromises = validMetadata.map(async (metadata) => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/${metadata.date}/enriched.geojson`)
          if (!response.ok) {
            throw new Error(`Failed to load GeoJSON for ${metadata.date}`)
          }
          const geojson = await response.json()
          
          let goodCount = 0
          let cautionCount = 0
          let poorCount = 0

          geojson.features.forEach((feature: any) => {
            const mpn = feature.properties.mpn
            if (mpn === null || mpn === undefined) return
            
            if (mpn <= 35) {
              goodCount++
            } else if (mpn <= 104) {
              cautionCount++
            } else {
              poorCount++
            }
          })

          return {
            ...metadata,
            goodSites: goodCount,
            cautionSites: cautionCount,
            poorSites: poorCount
          }
        } catch (err) {
          console.warn(`Failed to process GeoJSON for ${metadata.date}:`, err)
          return metadata // Return original metadata if GeoJSON fails
        }
      })

      const enrichedResults = await Promise.all(enrichedMetadataPromises)
      allMetadata.value = enrichedResults

    } catch (err) {
      console.error('Failed to load yearly stats:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load yearly stats'
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loadYearlyStats
  }
}
