<template>
  <div class="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white z-20">
    <div class="container mx-auto">
      <h1 class="text-2xl font-bold">NYC Water Quality</h1>
      <div class="flex justify-between items-center">
        <div>
          <p>Latest data: {{ formattedDate }}</p>
          <p>{{ siteCount }} sampling sites</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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