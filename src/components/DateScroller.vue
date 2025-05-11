<template>
  <div class="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30">
    <div class="inline-flex items-center bg-white bg-opacity-90 rounded-full px-4 py-2 shadow-md">
      <button 
        @click="selectPrevious"
        class="w-8 h-8 flex items-center justify-center mr-2 text-gray-600 hover:text-black disabled:opacity-30 focus:outline-none"
        :disabled="!hasPrevious"
        aria-label="Previous date"
      >
        &larr;
      </button>
      
      <div class="px-2 text-center">
        <span class="text-sm font-medium text-gray-800">{{ formattedModelValue }}</span>
      </div>
      
      <button 
        @click="selectNext"
        class="w-8 h-8 flex items-center justify-center ml-2 text-gray-600 hover:text-black disabled:opacity-30 focus:outline-none"
        :disabled="!hasNext"
        aria-label="Next date"
      >
        &rarr;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  dates: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Computed properties
const currentIndex = computed(() => {
  return props.dates.indexOf(props.modelValue)
})

const hasPrevious = computed(() => {
  return currentIndex.value > 0
})

const hasNext = computed(() => {
  return currentIndex.value < props.dates.length - 1
})

const formattedModelValue = computed(() => {
  if (!props.modelValue) return ''
  
  try {
    const date = new Date(props.modelValue)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (e) {
    return props.modelValue
  }
})

// Methods
const selectPrevious = () => {
  if (hasPrevious.value) {
    emit('update:modelValue', props.dates[currentIndex.value - 1])
  }
}

const selectNext = () => {
  if (hasNext.value) {
    emit('update:modelValue', props.dates[currentIndex.value + 1])
  }
}
</script>