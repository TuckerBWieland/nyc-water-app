<template>
  <div
    v-if="isOpen"
    ref="popupRef"
    @click.stop
    :class="[
      'fixed z-[400] bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]',
      'p-4 sm:p-6 rounded-lg shadow-lg',
      'max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-stable',
      'transition-colors duration-300',
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black',
    ]"
  >
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-bold">{{ title }}</h3>
      <button
        :class="isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
        @click="$emit('close')"
      >
        &times;
      </button>
    </div>
    <div class="prose text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const popupRef = ref(null);

/**
 * Close the popup when clicking outside of it.
 *
 * @param {MouseEvent} e - Click event object.
 */
const handleOutsideClick = e => {
  if (popupRef.value && !popupRef.value.contains(e.target)) {
    emit('close');
  }
};

watch(() => props.isOpen, open => {
  if (open) {
    document.addEventListener('click', handleOutsideClick);
  } else {
    document.removeEventListener('click', handleOutsideClick);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>