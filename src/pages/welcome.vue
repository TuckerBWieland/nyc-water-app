<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useYearlyStats } from '@/composables/useYearlyStats'
import { isDarkMode } from '@/stores/theme'
import ThemeToggleButton from '@/components/ThemeToggleButton.vue'
import latestDate from '@/generated/latest-date'

const router = useRouter()
const { stats, loadYearlyStats } = useYearlyStats()

onMounted(() => {
  loadYearlyStats()
})

const viewMap = () => {
  router.push(`/${latestDate}`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col" :class="isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'">
    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="px-6 py-8 relative">
        <!-- Theme toggle in top right -->
        <div class="absolute top-4 right-4">
          <ThemeToggleButton :isDarkMode="isDarkMode" :sticky="false" />
        </div>
        
        <h1 class="text-2xl md:text-2xl font-bold mb-4 tracking-tight text-left">
          NYC Water Quality
        </h1>
      </header>

      <!-- Main content area -->
      <main class="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div class="max-w-4xl mx-auto text-center space-y-12">
          <!-- Large impact text -->
          <div class="space-y-6">
            <div v-if="stats.loading" class="animate-pulse">
              <div class="h-16 md:h-24 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
              <div class="h-16 md:h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            
            <div v-else-if="stats.error" class="text-red-500">
              <p class="text-xl">Failed to load data: {{ stats.error }}</p>
            </div>
            
            <div v-else class="space-y-8">
              <!-- Main impact statement -->
              <h2 class="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
                <span class="block">WE'VE COLLECTED</span>
                <span class="block text-blue-600 dark:text-blue-400">{{ stats.totalSamples.toLocaleString() }}</span>
                <span class="block">SAMPLES</span>
                <span class="block">THIS YEAR</span>
              </h2>
              
              <!-- Unsafe count -->
              <p class="text-3xl md:text-4xl lg:text-5xl font-semibold text-red-600 dark:text-red-400">
                {{ stats.unsafeSamples.toLocaleString() }} have tested unsafe for human contact
              </p>
            </div>
          </div>

          <!-- Description paragraph -->
          <div class="max-w-2xl mx-auto space-y-6">
            <p class="text-lg md:text-xl leading-relaxed" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
              This app visualizes water quality data from New York City's waterways, showing bacterial contamination levels 
              at sampling sites across the five boroughs. The data helps residents understand which areas may be unsafe 
              for activities like swimming, kayaking, or fishing.
            </p>
            
            <p class="text-base md:text-lg leading-relaxed" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
              Samples are categorized as safe (green), caution (yellow), or unsafe (red) based on bacterial levels. 
              Higher bacterial counts typically occur after rainfall when stormwater runoff carries pollutants into waterways.
            </p>
          </div>


        </div>
      </main>

      <!-- Footer with CTA -->
      <footer class="px-6 py-8 text-center">
        <div class="flex flex-col items-center space-y-6">
          <button 
            @click="viewMap"
            class="inline-flex items-center px-8 py-4 text-xl font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg hover:shadow-xl"
            :class="isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'"
          >
            <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
            View Latest Map Data
          </button>
          
          <!-- Secondary navigation links -->
          <div class="flex gap-6 text-sm">
            <router-link 
              to="/trends"
              class="transition-colors hover:underline"
              :class="isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'"
            >
              📊 View Trends
            </router-link>
            <router-link 
              to="/research"
              class="transition-colors hover:underline"
              :class="isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'"
            >
              🔬 Statistical Analysis
            </router-link>
          </div>
          
          <p class="text-sm" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
            Last update: {{ new Date().toLocaleDateString() }}
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
.tracking-tight {
  letter-spacing: -0.025em;
}

@media (max-width: 640px) {
  .text-8xl {
    font-size: 4rem;
    line-height: 1;
  }
  .text-7xl {
    font-size: 3.5rem;
    line-height: 1;
  }
  .text-5xl {
    font-size: 2.5rem;
    line-height: 1.1;
  }
}
</style>
