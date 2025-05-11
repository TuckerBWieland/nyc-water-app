<template>
  <!-- Full Header Panel -->
  <transition name="slide-fade">
    <div v-if="isExpanded" class="absolute top-0 left-0 right-0 p-4 bg-white bg-opacity-90 text-gray-800 shadow-md z-30">
      <div class="container mx-auto max-w-3xl">
        <h1 class="text-2xl font-bold mb-2">NYC Water Quality</h1>
        <div class="space-y-1 text-sm">
          <p><span class="font-medium">Date of current view:</span> {{ formattedDate }}</p>
          <p><span class="font-medium">Total sites sampled:</span> {{ siteCount }}</p>
          <p><span class="font-medium">7-day rainfall:</span> 1.25 inches</p>
          <p class="mt-2 text-blue-600 hover:underline">
            <a href="https://data.cityofnewyork.us/Environment/Harbor-Water-Quality/5uug-f49n" target="_blank" rel="noopener noreferrer">
              Detailed Source Data
            </a>
          </p>
        </div>
        
        <!-- Toggle Button at bottom of panel -->
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <button 
            @click="toggleExpanded"
            class="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md focus:outline-none"
            aria-label="Collapse header"
          >
            <span class="text-gray-600">▲</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
  
  <!-- Collapsed State Button -->
  <transition name="fade">
    <div v-if="!isExpanded" class="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
      <button 
        @click="toggleExpanded"
        class="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md focus:outline-none"
        aria-label="Expand header"
      >
        <span class="text-gray-600">▼</span>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue'

// State
const isExpanded = ref(true)

// Toggle function
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Props
const props = defineProps({
  latestDate: {
    type: String,
    required: true
  },
  siteCount: {
    type: Number,
    default: 0
  }
})

// Computed properties
const formattedDate = computed(() => {
  if (!props.latestDate) return ''
  
  try {
    const date = new Date(props.latestDate)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (e) {
    return props.latestDate
  }
})
</script>

<style scoped>
/* Transition for panel slide */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Transition for button fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>