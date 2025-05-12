<template>
  <!-- Full Header Panel -->
  <transition name="slide-fade">
    <div
      v-if="isExpanded"
      ref="headerRef"
      :class="[
        'absolute top-0 left-0 right-0 p-4 shadow-md z-30 transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white bg-opacity-90 text-gray-800'
      ]"
    >
      <div class="container mx-auto max-w-3xl relative flex flex-col items-center">
        <!-- Content container with all centered text -->
        <div class="w-full max-w-lg text-center">
          <!-- Header content -->
          <div class="mb-2">
            <h1 class="text-2xl font-bold">NYC Water Quality</h1>
          </div>

          <div class="space-y-1 text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
            <p><span class="font-medium">Date of current view:</span> {{ formattedDate }}</p>
            <p><span class="font-medium">Total sites sampled:</span> {{ siteCount }}</p>
            <p><span class="font-medium">7-day rainfall:</span> 1.25 inches</p>
            <p class="mt-2">
              <a
                href="https://docs.google.com/spreadsheets/d/12wNiul0QSymg3gO9OdwKkvAms-iHkz2i0hyxl6AP8eQ/edit?gid=0#gid=0"
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
    </div>
  </transition>
  
  <!-- Toggle Button for expanded state - attached to the bottom of header -->
  <div
    v-if="isExpanded"
    class="absolute left-1/2 transform -translate-x-1/2 z-40"
    style="top: calc(var(--header-height, 0px) - 5px);"
  >
    <button
      @click="toggleExpanded"
      :class="[
        'rounded-full w-10 h-10 flex items-center justify-center shadow-md focus:outline-none transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
      ]"
      aria-label="Collapse header"
      title="Toggle header"
    >
      <span class="font-semibold text-lg">▲</span>
    </button>
  </div>

  <!-- Collapsed state toggle button - fixed at top of screen -->
  <div
    v-if="!isExpanded"
    class="absolute top-4 left-1/2 transform -translate-x-1/2 z-40"
  >
    <button
      @click="toggleExpanded"
      :class="[
        'rounded-full w-10 h-10 flex items-center justify-center shadow-md focus:outline-none transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
      ]"
      aria-label="Expand header"
      title="Toggle header"
    >
      <span class="font-semibold text-lg">▼</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, watch } from 'vue'

// State
const isExpanded = ref(false)

// Emit events
const emit = defineEmits(['toggleMapMode', 'update:isExpanded'])

// References
const headerRef = ref(null)

// Toggle header expanded state
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value

  // Emit the expanded state to parent
  emit('update:isExpanded', isExpanded.value)

  // If expanding, wait for next tick then measure and set header height
  if (isExpanded.value) {
    nextTick(() => {
      updateHeaderHeight()
    })
  }
}

// Update the CSS variable for header height
const updateHeaderHeight = () => {
  if (headerRef.value) {
    const height = headerRef.value.offsetHeight
    document.documentElement.style.setProperty('--header-height', `${height}px`)
  }
}

// Toggle map mode and emit event to parent
const toggleMapMode = () => {
  emit('toggleMapMode', !props.isDarkMode)
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
  },
  isDarkMode: {
    type: Boolean,
    default: false
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

// Initialize header height on mount and when content changes
onMounted(() => {
  nextTick(() => {
    updateHeaderHeight()
  })
})

// Update height when site count changes (content might change size)
watch(() => props.siteCount, () => {
  nextTick(() => {
    updateHeaderHeight()
  })
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