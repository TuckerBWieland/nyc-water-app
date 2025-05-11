<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <MapViewer 
      :selectedDate="selectedDate" 
      @update:siteCount="updateSiteCount" 
    />
    <HeaderOverlay :latestDate="selectedDate" :siteCount="siteCount" />
    <DateScroller :dates="dates" v-model="selectedDate" />
    <InfoPopup />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MapViewer from './components/MapViewer.vue'
import HeaderOverlay from './components/HeaderOverlay.vue'
import DateScroller from './components/DateScroller.vue'
import InfoPopup from './components/InfoPopup.vue'

const dates = ref([])
const selectedDate = ref('')
const siteCount = ref(0)

const updateSiteCount = (count) => {
  siteCount.value = count
}

onMounted(async () => {
  const res = await fetch('/data/index.json')
  const index = await res.json()
  dates.value = index.dates
  selectedDate.value = index.latest
})
</script>