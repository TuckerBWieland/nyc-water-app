<template>
  <div v-if="isOpen" class="absolute top-0 right-0 mt-16 mr-4 p-4 bg-white text-black rounded shadow-lg z-30 max-w-sm">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">About This Map</h3>
      <button @click="isOpen = false" class="text-gray-500 hover:text-gray-700">
        &times;
      </button>
    </div>
    <div class="prose text-sm">
      <p>This application displays water quality data for New York City water sampling sites.</p>
      <p>Data is collected daily and includes various measurements related to water quality and safety.</p>
      <p>Use the timeline at the bottom to navigate between dates.</p>
    </div>
  </div>
  
  <button 
    @click="isOpen = !isOpen"
    class="absolute top-4 right-4 z-30 bg-white rounded-full p-2 shadow-md"
    title="Information"
  >
    <span class="w-6 h-6 flex items-center justify-center text-black">i</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

// State
const isOpen = ref(false)
</script>