<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';
import { isDarkMode, toggleDarkMode } from '../stores/theme';

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
  <div class="min-h-screen flex flex-col max-w-screen-lg mx-auto px-4 py-4 text-gray-800 dark:text-gray-200">
    <!-- Theme toggle -->
    <button
      @click="toggleDarkMode"
      class="fixed top-4 right-4 z-50 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-300"
      :class="isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>

    <div v-if="loading" class="text-center py-10">Loading…</div>
    <RainfallSampleTrend v-else :history="history" :isDarkMode="isDarkMode" />

    <p class="text-sm mt-4 max-w-2xl text-gray-400 dark:text-gray-300">
      Each dot in the line shows daily rainfall totals for the past several weeks. Water quality
      samples are collected on Thursdays, and each stacked bar shows how many samples fell into good,
      caution, or unsafe zones that day. Since NYC’s sewers overflow during storms, rainfall right
      before Thursday is the biggest factor in poor water quality.
    </p>

    <button
      class="mt-6 self-center px-4 py-2 rounded font-semibold bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
      @click="goHome"
    >
      ← Back to Map
    </button>
  </div>
</template>
