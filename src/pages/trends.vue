<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';

const history = ref([]);
const loading = ref(true);
const router = useRouter();

onMounted(async () => {
  try {
    const base = import.meta.env.MODE === 'production' ? '/nyc-water-app' : '';
    const res = await fetch(`${base}/data/dates.json`);
    const dates = (await res.json()) || [];
    const weekly = [];
    for (const date of dates) {
      const geoRes = await fetch(`${base}/data/${date}/enriched.geojson`);
      if (!geoRes.ok) continue;
      const geo = await geoRes.json();
      const summary = { good: 0, caution: 0, unsafe: 0 };
      for (const f of geo.features) {
        const mpn = Number(f.properties.mpn);
        if (mpn < 35) summary.good++;
        else if (mpn <= 104) summary.caution++;
        else summary.unsafe++;
      }
      const rainfallByDay = geo.features[0]?.properties.rainByDay || [];
      weekly.push({ date, rainfallByDay, sampleSummary: summary });
    }
    history.value = weekly.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.warn('Error loading trend data:', err);
  } finally {
    loading.value = false;
  }
});

const goHome = () => router.push('/');
</script>

<template>
  <div class="min-h-screen flex flex-col p-4">
    <p class="mb-4 text-sm text-gray-800 dark:text-gray-200">
      Each dot in the line shows daily rainfall totals for the past several weeks. Water quality
      samples are collected on Thursdays, and each stacked bar shows how many samples fell into good,
      caution, or unsafe zones that day. Since NYC’s sewers overflow during storms, rainfall right
      before Thursday is the biggest factor in poor water quality.
    </p>

    <div v-if="loading" class="text-center py-10">Loading…</div>
    <RainfallSampleTrend v-else :history="history" />

    <button
      class="mt-6 self-center px-4 py-2 rounded font-semibold bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
      @click="goHome"
    >
      ← Back to Map
    </button>
  </div>
</template>
