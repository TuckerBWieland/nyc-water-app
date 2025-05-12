<template>
  <div class="rain-drop-legend p-2 rounded shadow-md" :class="isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'">
    <h3 class="text-xs font-medium mb-1">7-Day Rainfall</h3>
    
    <div class="flex items-center">
      <!-- Water drop SVG with animated fill -->
      <div class="relative w-8 h-12 mr-2">
        <svg 
          viewBox="0 0 100 160" 
          xmlns="http://www.w3.org/2000/svg" 
          class="w-full h-full"
        >
          <!-- Droplet outline -->
          <path 
            d="M50,0 C50,0 0,70 0,110 C0,138.1 22.4,160 50,160 C77.6,160 100,138.1 100,110 C100,70 50,0 50,0 Z" 
            stroke="currentColor" 
            stroke-width="2" 
            fill="none" 
            :class="isDarkMode ? 'text-sky-600' : 'text-sky-700'"
          />
          
          <!-- Droplet fill - uses clipPath to animate fill level -->
          <path 
            d="M50,0 C50,0 0,70 0,110 C0,138.1 22.4,160 50,160 C77.6,160 100,138.1 100,110 C100,70 50,0 50,0 Z" 
            class="text-sky-400"
            fill="currentColor"
            :clip-path="'url(#rainClip' + _uid + ')'"
          />
          
          <!-- Clip path for water level -->
          <clipPath :id="'rainClip' + _uid">
            <rect 
              x="0" 
              y="0" 
              width="100" 
              height="160" 
              :transform="`translate(0, ${160 - fillHeight})`"
              class="transform transition-transform duration-1000 ease-out"
            />
          </clipPath>
          
          <!-- Highlight/shine effect -->
          <path 
            d="M25,60 Q50,95 25,130" 
            stroke="white" 
            stroke-width="4" 
            stroke-linecap="round" 
            fill="none" 
            opacity="0.25"
          />
        </svg>
      </div>
      
      <!-- Rainfall text -->
      <div class="text-center">
        <span class="text-lg font-bold">{{ rainfall }}</span>
        <span class="text-xs">in</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

// Props
const props = defineProps({
  rainfall: {
    type: Number,
    default: 0
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

// Generate a unique ID for the clip-path
const _uid = ref(`rain-${Math.random().toString(36).substring(2, 9)}`);

// Calculate fill height (0-160 based on rainfall 0-10)
const fillHeight = computed(() => {
  // Cap rainfall at 10 inches (100%)
  const percentage = Math.min(props.rainfall / 10, 1);
  return percentage * 160;
});
</script>

<style scoped>
.rain-drop-legend {
  min-width: 80px;
}
</style>