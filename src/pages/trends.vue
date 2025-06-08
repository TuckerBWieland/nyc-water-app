<script setup>
import { ref, onMounted } from 'vue';
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';
import { isDarkMode } from '../stores/theme';
import ThemeToggleButton from '../components/ThemeToggleButton.vue';

const history = ref([]);
const loading = ref(true);

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

</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="max-w-screen-lg mx-auto px-4 py-6 text-center">
      <!-- Theme toggle -->
      <ThemeToggleButton :isDarkMode="isDarkMode" />

      <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Trends: Rainfall vs Water Quality
      </h1>

      <div v-if="loading" class="text-center py-10">Loading…</div>
      <div v-else class="overflow-x-auto">
        <RainfallSampleTrend :history="history" :isDarkMode="isDarkMode" />
      </div>

      <div class="flex flex-row flex-wrap justify-center gap-4 mt-4 text-xs">
        <div class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-500 rounded"></span> Rainfall (in)</div>
        <div class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded"></span> Good (<35)</div>
        <div class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-400 rounded"></span> Caution (35–104)</div>
        <div class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded"></span> Unsafe (>104)</div>
      </div>

      <p class="text-base text-gray-700 dark:text-gray-300 mt-6 max-w-prose mx-auto">
        Each dot in the line shows daily rainfall totals for the past several weeks. Water quality
        samples are collected on Thursdays, and each stacked bar shows how many samples fell into good,
        caution, or unsafe zones that day. Since NYC’s sewers overflow during storms, rainfall right
        before Thursday is the biggest factor in poor water quality.
      </p>

      <router-link to="/" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          ← Back to Map
        </button>
      </router-link>
    </div>
  </div>
</template>
