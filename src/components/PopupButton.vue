<template>
  <button
    :class="[
      'rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors duration-300 pointer-events-auto touch-action-manipulation',
      variant === 'notification' && showNotification
        ? 'bg-orange-700 text-white hover:bg-orange-800'
        : isDarkMode
        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        : 'bg-white text-gray-800 hover:bg-gray-100'
    ]"
    :style="{ pointerEvents: 'auto', touchAction: 'manipulation' }"
    :title="title"
    @click.stop="$emit('click')"
    @touchstart.stop.prevent="$emit('click')"
  >
    <span class="font-semibold text-lg pointer-events-none">{{ icon }}</span>
  </button>
</template>

<script setup>
defineProps({
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'default',
    validator: value => ['default', 'notification'].includes(value),
  },
  showNotification: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>