<script setup>
import { ref, onMounted } from 'vue';
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';
import { isDarkMode } from '../stores/theme';
import ThemeToggleButton from '../components/ThemeToggleButton.vue';
import { basePath } from '../utils/basePath';


const history = ref([]);
const loading = ref(true);
const locationStats = ref([]);

onMounted(async () => {
  try {
    const base = basePath;
    const res = await fetch(`${base}/data/dates.json`);
    const dates = (await res.json()) || [];
    const weekly = (
      await Promise.all(
        dates.map(async date => {
          const geoRes = await fetch(`${base}/data/${date}/enriched.geojson`);
          if (!geoRes.ok) return null;
          const geo = await geoRes.json();
          const summary = { good: 0, caution: 0, unsafe: 0 };
          let mpnSum = 0;
          let mpnCount = 0;
          
          for (const f of geo.features) {
            const mpn = Number(f.properties.mpn);
            if (!isNaN(mpn)) {
              mpnSum += mpn;
              mpnCount++;
            }
            if (mpn < 35) summary.good++;
            else if (mpn <= 104) summary.caution++;
            else summary.unsafe++;
          }
          
          const rainfallByDay = geo.features[0]?.properties.rainByDay || [];
          const totalRainfall = rainfallByDay.reduce((sum, val) => sum + val, 0);
          
          // Calculate 1-2 day rainfall window (strongest correlation)
          const recent2DayRainfall = rainfallByDay.length >= 2 
            ? rainfallByDay.slice(-2).reduce((sum, val) => sum + val, 0)
            : totalRainfall;
          
          const avgMpn = mpnCount > 0 ? mpnSum / mpnCount : 0;
          
          return { 
            date, 
            rainfallByDay, 
            sampleSummary: summary,
            totalRainfall,
            recent2DayRainfall,
            avgMpn 
          };
        })
      )
    ).filter(Boolean);
    history.value = weekly.sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate location statistics
    const byLocation = new Map();
    for (const week of weekly) {
      const geoRes = await fetch(`${base}/data/${week.date}/enriched.geojson`);
      if (!geoRes.ok) continue;
      const geo = await geoRes.json();
      
      for (const f of geo.features) {
        const siteName = f.properties.siteName;
        const mpn = Number(f.properties.mpn);
        
        if (!siteName || isNaN(mpn)) continue;
        
        if (!byLocation.has(siteName)) {
          byLocation.set(siteName, []);
        }
        byLocation.get(siteName).push(mpn);
      }
    }
    
    // Calculate stats for each location
    const stats = Array.from(byLocation.entries()).map(([siteName, mpns]) => {
      const avg = mpns.reduce((sum, m) => sum + m, 0) / mpns.length;
      const sorted = [...mpns].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const unsafeCount = mpns.filter(m => m > 104).length;
      const goodCount = mpns.filter(m => m <= 35).length;
      
      return {
        siteName,
        avgMpn: avg,
        medianMpn: median,
        samples: mpns.length,
        consistentlyUnsafe: unsafeCount / mpns.length >= 0.75,
        consistentlyGood: goodCount / mpns.length >= 0.75
      };
    });
    
    stats.sort((a, b) => b.avgMpn - a.avgMpn);
    locationStats.value = stats;
    
  } catch (err) {
    console.warn('Error loading trend data:', err);
  } finally {
    loading.value = false;
  }
});

</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
    <div class="max-w-screen-lg mx-auto px-4 pt-14 pb-24 text-center">
      <!-- Theme toggle -->
      <ThemeToggleButton :isDarkMode="isDarkMode" />

      <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Trends: Rainfall vs Water Quality
      </h1>

      <div v-if="loading" class="text-center py-10">Loading…</div>
      <div v-else class="overflow-x-auto">
        <RainfallSampleTrend :history="history" :isDarkMode="isDarkMode" />
      </div>

      <p class="text-base text-gray-700 dark:text-gray-300 mt-6 max-w-prose mx-auto">
        This heatmap shows how recent rainfall relates to citywide average water quality. While there's a 
        moderate correlation, <strong>individual location matters much more</strong>. Some sites are consistently 
        unsafe due to poor circulation, nearby outfalls, or wildlife—regardless of weather.
      </p>
      
      <!-- Location Insights -->
      <div v-if="locationStats.length > 0" class="mt-8 max-w-screen-lg mx-auto">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">📍 Best & Worst Locations</h2>
        
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Worst Locations -->
          <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h3 class="font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
              <span>🚨</span> Avoid These Locations
            </h3>
            <div class="space-y-2 text-sm">
              <div v-for="(loc, idx) in locationStats.slice(0, 5)" :key="loc.siteName" class="text-left">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ idx + 1 }}. {{ loc.siteName }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  Avg MPN: {{ Math.round(loc.avgMpn) }}
                  <span v-if="loc.consistentlyUnsafe" class="ml-1 text-red-600 dark:text-red-400">(always unsafe)</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Best Locations -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h3 class="font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
              <span>✅</span> Consistently Safe Locations
            </h3>
            <div class="space-y-2 text-sm">
              <div v-for="(loc, idx) in locationStats.slice(-5).reverse()" :key="loc.siteName" class="text-left">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ idx + 1 }}. {{ loc.siteName }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  Avg MPN: {{ Math.round(loc.avgMpn) }}
                  <span v-if="loc.consistentlyGood" class="ml-1 text-green-600 dark:text-green-400">(always safe)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-400 mt-6 max-w-prose mx-auto p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
        <strong class="text-gray-900 dark:text-gray-100">💡 Takeaway:</strong>
        <p class="mt-2">Check your specific location on the map before swimming. Some spots like Hudson River piers 
        are consistently safe, while others like Gowanus Canal or Newtown Creek are chronically polluted. 
        Rain matters, but <strong>where you swim matters more</strong>.</p>
      </div>

      <!-- Dual CTA buttons -->
      <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-3">
        <router-link to="/">
          <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            🏠 Home
          </button>
        </router-link>
        <router-link to="/map">
          <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            📍 Map
          </button>
        </router-link>
      </div>
    </div>
  </div>
</template>
