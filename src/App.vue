<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <MapViewer
      :selectedDate="selectedDate"
      :isDarkMode="isDarkMode"
      @update:siteCount="updateSiteCount"
      @update:sampleData="updateSampleData"
    />
    <HeaderOverlay
      :latestDate="selectedDate"
      :siteCount="siteCount"
      :isDarkMode="isDarkMode"
      v-model:isExpanded="isHeaderExpanded"
      @toggleMapMode="updateMapMode"
    />

    <!-- Dark/Light Mode Toggle Button -->
    <div class="absolute right-2 sm:right-4 top-4 z-40">
      <button
        @click="toggleDarkMode"
        :class="[
          'rounded-full p-2 shadow-md focus:outline-none transition-colors duration-300',
          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'
        ]"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        aria-label="Toggle dark mode"
      >
        <span class="text-lg">{{ isDarkMode ? '🌞' : '🌙' }}</span>
      </button>
    </div>

    <!-- Legend components in top-left corner - only visible when header is collapsed -->
    <div
      v-if="!isHeaderExpanded"
      class="absolute top-4 left-4 z-40 flex flex-col space-y-2"
    >
      <SampleBarLegend
        :samples="sampleData"
        :isDarkMode="isDarkMode"
      />
      <RainDropLegend
        :rainfall="rainfall"
        :isDarkMode="isDarkMode"
      />
    </div>

    <!-- Bottom navigation elements stacked in proper order -->
    <DateScroller :dates="dates" v-model="selectedDate" :isDarkMode="isDarkMode" />
    <InfoPopup :isDarkMode="isDarkMode" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MapViewer from './components/MapViewer.vue'
import HeaderOverlay from './components/HeaderOverlay.vue'
import DateScroller from './components/DateScroller.vue'
import InfoPopup from './components/InfoPopup.vue'
import SampleBarLegend from './components/SampleBarLegend.vue'
import RainDropLegend from './components/RainDropLegend.vue'

const dates = ref([])
const selectedDate = ref('')
const siteCount = ref(0)
const isDarkMode = ref(true) // Default to dark mode
const isHeaderExpanded = ref(false) // Track header state
const sampleData = ref([]) // Sample data for legend
const rainfall = ref(1.25) // Rainfall data

const updateSiteCount = (count) => {
  siteCount.value = count
}

const updateSampleData = (data) => {
  sampleData.value = data
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
}

const updateMapMode = (darkMode) => {
  isDarkMode.value = darkMode
}

onMounted(async () => {
  const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`)
  const index = await res.json()
  dates.value = index.dates
  selectedDate.value = index.latest
})
</script>