import { ref, unref } from 'vue';

// Accepts a ref to a date string so the composable can
// load new data when the date value changes.
export function useStaticData(dateRef) {
  const data = ref(null);
  const metadata = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function load(currentDate = unref(dateRef)) {
    console.log(`Loading data for date: ${currentDate}`);

    if (!currentDate) {
      console.error('No date provided');
      error.value = 'No date provided';
      return;
    }

    error.value = null;
    loading.value = true;

    try {
      // Get the base URL for GitHub Pages
      const base = import.meta.env.MODE === 'production' ? '/nyc-water-app' : '';

      // Build URLs with correct base path
      const geojsonUrl = `${base}/data/${currentDate}/enriched.geojson`;
      const metadataUrl = `${base}/data/${currentDate}/metadata.json`;

      console.log(`Fetching from: ${geojsonUrl} and ${metadataUrl}`);

      const [geojsonRes, metadataRes] = await Promise.all([fetch(geojsonUrl), fetch(metadataUrl)]);

      if (!geojsonRes.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${geojsonRes.status}`);
      }

      if (!metadataRes.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataRes.status}`);
      }

      const geojsonData = await geojsonRes.json();
      const metadataData = await metadataRes.json();

      console.log('GeoJSON loaded with features:', geojsonData.features?.length);
      console.log('Metadata loaded:', metadataData);

      data.value = geojsonData;
      metadata.value = metadataData;
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
