<script setup>
import { ref, onMounted } from 'vue';
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';
import { isDarkMode, toggleDarkMode } from '../stores/theme';

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
      <button
        @click="toggleDarkMode"
        class="fixed top-4 right-4 z-50 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-300"
        :class="isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'"
      >
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Trends: Rainfall vs Water Quality
      </h1>

      <div class="flex flex-wrap justify-center gap-4 mb-4 text-sm font-medium">
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-blue-500 rounded"></span> Rainfall (in)</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-green-500 rounded"></span> Samples testing good (<35)</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-yellow-400 rounded"></span> Samples testing caution (35–104)</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-red-500 rounded"></span> Samples testing unsafe (>104)</div>
      </div>

      <div v-if="loading" class="text-center py-10">Loading…</div>
      <div v-else class="overflow-x-auto">
        <RainfallSampleTrend :history="history" :isDarkMode="isDarkMode" />
      </div>

      <p class="text-base text-gray-700 dark:text-gray-300 mt-6 max-w-prose mx-auto">
        Each dot in the line shows daily rainfall totals for the past several weeks. Water quality
        samples are collected on Thursdays, and each stacked bar shows how many samples fell into good,
        caution, or unsafe zones that day. Since NYC’s sewers overflow during storms, rainfall right
        before Thursday is the biggest factor in poor water quality.
      </p>

      <router-link to="/" class="inline-block mt-8">
        <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600">
          ← Back to Map
        </button>
      </router-link>
    </div>
  </div>
</template>
