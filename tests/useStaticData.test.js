import { ref } from 'vue';
import { useStaticData } from '../src/composables/useStaticData';

class MockStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

describe('useStaticData', () => {
  let originalFetch;
  let originalSessionStorage;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalSessionStorage = global.sessionStorage;
    global.sessionStorage = new MockStorage();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.sessionStorage = originalSessionStorage;
    jest.clearAllMocks();
  });

  test('loads data and metadata successfully', async () => {
    const geojson = { features: [1, 2, 3] };
    const meta = { updated: '2023-01-01' };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meta) });

    const date = ref('2023-01-01');
    const { data, metadata, loading, error, load } = useStaticData(date);

    const promise = load();
    expect(loading.value).toBe(true);
    await promise;

    expect(data.value).toEqual(geojson);
    expect(metadata.value).toEqual(meta);
    expect(error.value).toBe(null);
    expect(loading.value).toBe(false);
  });

  test('handles fetch errors', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const date = ref('2023-02-01');
    const { data, metadata, error, loading, load } = useStaticData(date);

    await load();

    expect(error.value).toMatch('Failed to fetch GeoJSON');
    expect(data.value).toBe(null);
    expect(metadata.value).toBe(null);
    expect(loading.value).toBe(false);
  });

  test('handles metadata fetch failure', async () => {
    const geojson = { features: [] };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    const date = ref('2023-03-01');
    const { data, metadata, error, loading, load } = useStaticData(date);

    await load();

    expect(error.value).toMatch('Failed to fetch metadata');
    expect(data.value).toBe(null);
    expect(metadata.value).toBe(null);
    expect(loading.value).toBe(false);
  });

  test('handles missing date input', async () => {
    const date = ref('');
    const { data, metadata, error, loading, load } = useStaticData(date);

    await load('');

    expect(error.value).toBe('No date provided');
    expect(data.value).toBe(null);
    expect(metadata.value).toBe(null);
    expect(loading.value).toBe(false);
  });

  test('caches data in sessionStorage after load', async () => {
    const geojson = { features: [1] };
    const meta = { updated: '2023-04-01' };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(geojson) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meta) });

    const date = ref('2023-04-01');
    const { load } = useStaticData(date);

    await load();

    const cached = JSON.parse(
      global.sessionStorage.getItem('staticData-2023-04-01')
    );
    expect(cached.geojson).toEqual(geojson);
    expect(cached.metadata).toEqual(meta);
  });

  test('uses cached data when available', async () => {
    const geojson = { features: [1] };
    const meta = { updated: '2023-05-01' };

    global.sessionStorage.setItem(
      'staticData-2023-05-01',
      JSON.stringify({ geojson, metadata: meta })
    );

    global.fetch = jest.fn();

    const date = ref('2023-05-01');
    const { data, metadata, load } = useStaticData(date);

    await load();

    expect(data.value).toEqual(geojson);
    expect(metadata.value).toEqual(meta);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
