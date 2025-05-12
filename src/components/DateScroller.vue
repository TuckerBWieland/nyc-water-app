<template>
  <div class="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 z-30">
    <div 
      :class="[
        'inline-flex items-center rounded-full px-4 py-2 shadow-md transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 bg-opacity-90' : 'bg-white bg-opacity-90'
      ]"
    >
      <button 
        @click="selectPrevious"
        :class="[
          'w-8 h-8 flex items-center justify-center mr-2 disabled:opacity-30 focus:outline-none transition-colors duration-300',
          isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
        ]"
        :disabled="!hasPrevious"
        aria-label="Previous date"
      >
        &larr;
      </button>
      
      <div class="px-2 text-center">
        <span 
          :class="[
            'text-sm font-medium transition-colors duration-300',
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          ]"
        >
          {{ formattedModelValue }}
        </span>
      </div>
      
      <button 
        @click="selectNext"
        :class="[
          'w-8 h-8 flex items-center justify-center ml-2 disabled:opacity-30 focus:outline-none transition-colors duration-300',
          isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
        ]"
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
  },
  isDarkMode: {
    type: Boolean,
    default: false
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
    // Parse the date string and adjust for timezone
    const [year, month, day] = props.modelValue.split('-').map(Number)
    // Create date using UTC to prevent timezone issues (months are 0-indexed in JS Date)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Use UTC to avoid timezone shifts
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