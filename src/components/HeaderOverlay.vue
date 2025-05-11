<template>
  <!-- Full Header Panel -->
  <transition name="slide-fade">
    <div 
      v-if="isExpanded" 
      :class="[
        'absolute top-0 left-0 right-0 p-4 shadow-md z-30 transition-colors duration-300',
        isDarkMode ? 'bg-gray-900 bg-opacity-90 text-white' : 'bg-white bg-opacity-90 text-gray-800'
      ]"
    >
      <div class="container mx-auto max-w-3xl relative">
        <!-- Header content with flex layout to position title -->
        <div class="mb-2">
          <h1 class="text-2xl font-bold">NYC Water Quality</h1>
        </div>
        
        <div class="space-y-1 text-sm">
          <p><span class="font-medium">Date of current view:</span> {{ formattedDate }}</p>
          <p><span class="font-medium">Total sites sampled:</span> {{ siteCount }}</p>
          <p><span class="font-medium">7-day rainfall:</span> 1.25 inches</p>
          <p class="mt-2">
            <a 
              href="https://data.cityofnewyork.us/Environment/Harbor-Water-Quality/5uug-f49n" 
              target="_blank" 
              rel="noopener noreferrer"
              :class="isDarkMode ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'"
            >
              Detailed Source Data
            </a>
          </p>
        </div>
      </div>
    </div>
  </transition>
  
  <!-- Toggle Button positioned below panel instead of overlapping -->
  <div 
    v-if="isExpanded" 
    class="absolute left-1/2 transform -translate-x-1/2 z-30 top-full mt-1"
  >
    <button 
      @click="toggleExpanded"
      :class="[
        'rounded-full w-8 h-8 flex items-center justify-center shadow-md focus:outline-none transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
      ]"
      aria-label="Collapse header"
    >
      <span>▲</span>
    </button>
  </div>
  
  <!-- Collapsed State Button -->
  <transition name="fade">
    <div v-if="!isExpanded" class="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
      <button 
        @click="toggleExpanded"
        :class="[
          'rounded-full w-10 h-10 flex items-center justify-center shadow-md focus:outline-none transition-colors duration-300',
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
        ]"
        aria-label="Expand header"
      >
        <span>▼</span>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue'

// State
const isExpanded = ref(true)
const isDarkMode = ref(false)

// Emit events
const emit = defineEmits(['toggleMapMode'])

// Toggle header expanded state
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Toggle map mode and emit event to parent
const toggleMapMode = () => {
  isDarkMode.value = !isDarkMode.value
  emit('toggleMapMode', isDarkMode.value)
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