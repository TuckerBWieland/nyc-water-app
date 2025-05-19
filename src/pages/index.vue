<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    console.log('Fetching latest date...');
    // Get the base URL for GitHub Pages
    const base = import.meta.env.MODE === 'production' ? '/nyc-water-app' : '';
    const response = await fetch(`${base}/data/latest.txt`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch latest date: ${response.status}`);
    }
    
    const latest = await response.text();
    const trimmedDate = latest.trim();
    console.log('Latest date:', trimmedDate);
    
    if (trimmedDate) {
      router.push(`/${trimmedDate}`);
    } else {
      throw new Error('Empty date received');
    }
  } catch (err) {
    console.error('Redirect error:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="h-screen flex items-center justify-center flex-col">
    <div v-if="isLoading" class="text-center text-lg">
      <p>Redirecting to latest data...</p>
    </div>
    <div v-else-if="error" class="text-center text-red-500">
      <p>Error: {{ error }}</p>
      <p class="mt-2 text-sm">Try accessing a specific date directly, e.g., /2025-05-16</p>
    </div>
  </div>
</template>
