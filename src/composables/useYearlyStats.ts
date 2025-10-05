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

      // Load ALL dates for full year stats - optimized with parallel loading and cache
      const enrichedMetadataPromises = dates.map(async (date) => {
        try {
          // Check sessionStorage cache first
          const cacheKey = `staticData-${date}`
          const cached = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(cacheKey)
          
          let geojson
          let sampleCount = 0
          
          if (cached) {
            geojson = JSON.parse(cached).geojson
          } else {
            // Load just this one geojson for stats
            const response = await fetch(`${import.meta.env.BASE_URL}data/${date}/enriched.geojson`)
            if (!response.ok) return null
            geojson = await response.json()
          }
          
          let goodCount = 0
          let cautionCount = 0
          let poorCount = 0

          geojson.features.forEach((feature: any) => {
            const mpn = feature.properties.mpn
            if (mpn === null || mpn === undefined) return
            sampleCount++
            
            if (mpn <= 35) {
              goodCount++
            } else if (mpn <= 104) {
              cautionCount++
            } else {
              poorCount++
            }
          })

          return {
            date,
            totalSites: sampleCount,
            goodSites: goodCount,
            cautionSites: cautionCount,
            poorSites: poorCount,
            lastUpdated: date
          } as DataMetadata
        } catch (err) {
          console.warn(`Failed to process data for ${date}:`, err)
          return null
        }
      })

      const enrichedResults = await Promise.all(enrichedMetadataPromises)
      allMetadata.value = enrichedResults.filter((m): m is DataMetadata => m !== null)

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
