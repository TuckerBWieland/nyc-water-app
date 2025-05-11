<template>
  <div 
    v-if="isOpen" 
    :class="[
      'fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-40 max-w-sm mx-auto transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
    ]"
  >
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">About This Map</h3>
      <button 
        @click="isOpen = false" 
        :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
      >
        &times;
      </button>
    </div>
    <div class="prose text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
      <p>This application displays water quality data for New York City water sampling sites.</p>
      <p>Data is collected daily and includes various measurements related to water quality and safety.</p>
      <p>Use the date navigation above to switch between sampling dates.</p>
    </div>
  </div>
  
  <button 
    @click="isOpen = !isOpen"
    :class="[
      'absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
    ]"
    title="Information"
  >
    <span class="font-semibold text-lg">i</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// State
const isOpen = ref(false)
</script>