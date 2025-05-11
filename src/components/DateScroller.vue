<template>
  <div class="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white z-20">
    <div class="container mx-auto">
      <div class="flex items-center justify-center">
        <button 
          @click="selectPrevious"
          class="px-3 py-1 mr-2 bg-gray-700 hover:bg-gray-600 rounded"
          :disabled="!hasPrevious"
        >
          &larr;
        </button>
        
        <div class="flex-1 text-center">
          <span class="text-lg font-semibold">{{ formattedModelValue }}</span>
        </div>
        
        <button 
          @click="selectNext"
          class="px-3 py-1 ml-2 bg-gray-700 hover:bg-gray-600 rounded"
          :disabled="!hasNext"
        >
          &rarr;
        </button>
      </div>
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