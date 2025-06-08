<template>
  <button
    @click="toggleDarkMode"
    class="fixed top-4 right-4 z-50 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors duration-300"
    :class="isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'"
  >
    {{ isDarkMode ? '☀️' : '🌙' }}
  </button>
</template>

<script setup>
import { toggleDarkMode } from '../stores/theme';

defineProps({
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});
</script>
