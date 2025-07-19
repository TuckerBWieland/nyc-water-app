import { ref, type Ref } from 'vue'
import { useStaticData } from '../src/composables/useStaticData'
import type { WaterQualityGeoJSON, DataMetadata } from '../src/types'

// Mock Storage class with proper typing
class MockStorage implements Storage {
  private store: Record<string, string> = {}

  get length(): number {
    return Object.keys(this.store).length
  }

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

// MockResponse interface would be used for more complex mocking scenarios if needed

describe('useStaticData', () => {
  let originalFetch: typeof global.fetch
  let originalSessionStorage: Storage

  beforeEach(() => {
    originalFetch = global.fetch
    originalSessionStorage = global.sessionStorage
    global.sessionStorage = new MockStorage()
  })

  afterEach(() => {
    global.fetch = originalFetch
    global.sessionStorage = originalSessionStorage
    jest.clearAllMocks()
  })

  test('loads data and metadata successfully', async (): Promise<void> => {
    const geojson: WaterQualityGeoJSON = { 
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
          properties: { siteName: 'Test Site', mpn: 45 }
        }
      ]
    }
    const meta: DataMetadata = { 
      date: '2023-01-01',
      totalSites: 1,
      goodSites: 1,
      cautionSites: 0,
      poorSites: 0,
      lastUpdated: '2023-01-01T12:00:00Z'
    }

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: (): Promise<WaterQualityGeoJSON> => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: true, json: (): Promise<DataMetadata> => Promise.resolve(meta) })

    const date: Ref<string> = ref('2023-01-01')
    const { data, metadata, loading, error, load } = useStaticData(date)

    const promise = load()
    expect(loading.value).toBe(true)
    await promise

    expect(data.value).toEqual(geojson)
    expect(metadata.value).toEqual(meta)
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  test('handles fetch errors', async (): Promise<void> => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: (): Promise<Record<string, any>> => Promise.resolve({}) })

    const date: Ref<string> = ref('2023-02-01')
    const { data, metadata, error, loading, load } = useStaticData(date)

    await load()

    expect(error.value).toMatch('Failed to fetch GeoJSON')
    expect(data.value).toBe(null)
    expect(metadata.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  test('handles metadata fetch failure', async (): Promise<void> => {
    const geojson: WaterQualityGeoJSON = { 
      type: 'FeatureCollection',
      features: []
    }

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: (): Promise<WaterQualityGeoJSON> => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    const date: Ref<string> = ref('2023-03-01')
    const { data, metadata, error, loading, load } = useStaticData(date)

    await load()

    expect(error.value).toMatch('Failed to fetch metadata')
    expect(data.value).toBe(null)
    expect(metadata.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  test('handles missing date input', async (): Promise<void> => {
    const date: Ref<string> = ref('')
    const { data, metadata, error, loading, load } = useStaticData(date)

    await load('')

    expect(error.value).toBe('No date provided')
    expect(data.value).toBe(null)
    expect(metadata.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  test('caches data in sessionStorage after load', async (): Promise<void> => {
    const geojson: WaterQualityGeoJSON = { 
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
          properties: { siteName: 'Test Site', mpn: 45 }
        }
      ]
    }
    const meta: DataMetadata = { 
      date: '2023-04-01',
      totalSites: 1,
      goodSites: 1,
      cautionSites: 0,
      poorSites: 0,
      lastUpdated: '2023-04-01T12:00:00Z'
    }

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: (): Promise<WaterQualityGeoJSON> => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: true, json: (): Promise<DataMetadata> => Promise.resolve(meta) })

    const date: Ref<string> = ref('2023-04-01')
    const { load } = useStaticData(date)

    await load()

    const cachedData = global.sessionStorage.getItem('staticData-2023-04-01')
    expect(cachedData).toBeTruthy()
    
    if (cachedData) {
      const cached = JSON.parse(cachedData)
      expect(cached.geojson).toEqual(geojson)
      expect(cached.metadata).toEqual(meta)
    }
  })

  test('uses cached data when available', async (): Promise<void> => {
    const geojson: WaterQualityGeoJSON = { 
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
          properties: { siteName: 'Cached Site', mpn: 25 }
        }
      ]
    }
    const meta: DataMetadata = { 
      date: '2023-05-01',
      totalSites: 1,
      goodSites: 1,
      cautionSites: 0,
      poorSites: 0,
      lastUpdated: '2023-05-01T12:00:00Z'
    }

    global.sessionStorage.setItem(
      'staticData-2023-05-01',
      JSON.stringify({ geojson, metadata: meta })
    )

    global.fetch = jest.fn()

    const date: Ref<string> = ref('2023-05-01')
    const { data, metadata, load } = useStaticData(date)

    await load()

    expect(data.value).toEqual(geojson)
    expect(metadata.value).toEqual(meta)
    expect(global.fetch).not.toHaveBeenCalled()
  })
}) 