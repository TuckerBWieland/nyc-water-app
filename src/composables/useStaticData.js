import { ref, unref } from 'vue';
import { basePath } from '../utils/basePath';

// Accepts a ref to a date string so the composable can
// load new data when the date value changes.
/**
 * Load static GeoJSON data and related metadata for a specific date.
 *
 * @param {import('vue').Ref<string>|string} dateRef - Reactive date value.
 * @returns {{ data: import('vue').Ref<any>, metadata: import('vue').Ref<any>, loading: import('vue').Ref<boolean>, error: import('vue').Ref<string|null>, load: Function }}
 *   Reactive data references and a load function.
 */
export function useStaticData(dateRef) {
  const data = ref(null);
  const metadata = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch and cache GeoJSON and metadata for the provided date.
   *
   * @param {string} [currentDate=unref(dateRef)] - Date string to load data for.
   * @returns {Promise<void>} Resolves when loading is complete.
   */
  async function load(currentDate = unref(dateRef)) {

    if (!currentDate) {
      console.error('No date provided');
      error.value = 'No date provided';
      return;
    }

    error.value = null;
    loading.value = true;

    const cacheKey = `staticData-${currentDate}`;
    try {
      const cached =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        data.value = parsed.geojson;
        metadata.value = parsed.metadata;
        loading.value = false;
        return;
      }
    } catch (err) {
      console.warn('Failed to read from sessionStorage', err);
    }

    try {
      // Get the base URL for GitHub Pages
      const base = basePath;

      // Build URLs with correct base path
      const geojsonUrl = `${base}/data/${currentDate}/enriched.geojson`;
      const metadataUrl = `${base}/data/${currentDate}/metadata.json`;


      const [geojsonRes, metadataRes] = await Promise.all([fetch(geojsonUrl), fetch(metadataUrl)]);

      if (!geojsonRes.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${geojsonRes.status}`);
      }

      if (!metadataRes.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataRes.status}`);
      }

      const geojsonData = await geojsonRes.json();
      const metadataData = await metadataRes.json();


      data.value = geojsonData;
      metadata.value = metadataData;

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ geojson: geojsonData, metadata: metadataData })
          );
        }
      } catch (err) {
        console.warn('Failed to write to sessionStorage', err);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error.value = err.message;
      data.value = null;
      metadata.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { data, metadata, loading, error, load };
}
