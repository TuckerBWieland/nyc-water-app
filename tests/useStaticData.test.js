import { ref } from 'vue';
import { useStaticData } from '../src/composables/useStaticData';

describe('useStaticData', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('loads data and metadata successfully', async () => {
    const geojson = { features: [1, 2, 3] };
    const meta = { updated: '2023-01-01' };

    global.fetch = jest.fn()
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
    global.fetch = jest.fn()
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
});
