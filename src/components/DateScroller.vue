<template>
  <div
    class="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 z-30"
  >
    <div
      :class="[
        'inline-flex items-center rounded-full px-6 py-3 shadow-md transition-colors duration-300',
        isDarkMode ? 'bg-gray-800 bg-opacity-90' : 'bg-white bg-opacity-90',
      ]"
    >
      <button
        v-if="hasPrevious"
        :class="[
          'w-10 h-10 flex items-center justify-center mr-3 focus:outline-none transition-colors duration-300 text-xl',
          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black',
        ]"
        aria-label="Previous date"
        @click="selectPrevious"
      >
        &larr;
      </button>

      <div class="px-2 text-center whitespace-nowrap">
        <span
          :class="[
            'font-semibold transition-colors duration-300 text-sm sm:text-lg',
            isDarkMode ? 'text-gray-200' : 'text-gray-800',
          ]"
        >
          {{ formattedModelValue }}
        </span>
      </div>

      <button
        v-if="hasNext"
        :class="[
          'w-10 h-10 flex items-center justify-center ml-3 focus:outline-none transition-colors duration-300 text-xl',
          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black',
        ]"
        aria-label="Next date"
        @click="selectNext"
      >
        &rarr;
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'DateScroller',
  props: {
    dates: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  /**
   * Setup function for the DateScroller component.
   * Provides navigation between available dataset dates.
   *
   * @param {Object} props - Component properties.
   * @param {Function} emit - Emit function for Vue events.
   * @returns {Object} Reactive bindings for the template.
   */
  setup(props, { emit }) {
    const router = useRouter();

    // Computed properties
    const currentIndex = computed(() => {
      return props.dates.indexOf(props.modelValue);
    });

    const hasPrevious = computed(() => {
      return currentIndex.value > 0;
    });

    const hasNext = computed(() => {
      return currentIndex.value < props.dates.length - 1;
    });

    const formattedModelValue = computed(() => {
      if (!props.modelValue) return '';

      try {
        // Parse the date string and adjust for timezone
        const [year, month, day] = props.modelValue.split('-').map(Number);
        // Create date using UTC to prevent timezone issues (months are 0-indexed in JS Date)
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC', // Use UTC to avoid timezone shifts
        });
      } catch (e) {
        return props.modelValue;
      }
    });

    // Methods
    const selectPrevious = () => {
      if (hasPrevious.value) {
        const newDate = props.dates[currentIndex.value - 1];
        emit('update:modelValue', newDate);
        router.push({ path: `/${newDate}` });
      }
    };

    const selectNext = () => {
      if (hasNext.value) {
        const newDate = props.dates[currentIndex.value + 1];
        emit('update:modelValue', newDate);
        router.push({ path: `/${newDate}` });
      }
    };

    return {
      currentIndex,
      hasPrevious,
      hasNext,
      formattedModelValue,
      selectPrevious,
      selectNext,
    };
  },
};
</script>
