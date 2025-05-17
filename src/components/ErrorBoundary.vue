<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-12 h-12">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="error-title">{{ errorTitle }}</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button 
          class="retry-button"
          v-if="canRetry" 
          @click="handleRetry"
        >
          Try Again
        </button>
        <button 
          class="reset-button"
          @click="handleReset"
        >
          Reset
        </button>
      </div>
      <div v-if="showDetails && errorDetails" class="error-details">
        <details>
          <summary>Technical Details</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue';
import { ErrorSeverity, handleError } from '../utils/errorHandler';

interface Props {
  /** Custom error title to display */
  errorTitle?: string;
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether to allow retry functionality */
  canRetry?: boolean;
  /** Whether to show technical error details */
  showDetails?: boolean;
  /** Callback for when the error is caught */
  onError?: (error: Error, instance: any, info: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  errorTitle: 'Something went wrong',
  errorMessage: 'We encountered an error while loading this section',
  canRetry: true,
  showDetails: false,
  onError: undefined
});

const emit = defineEmits(['retry', 'reset']);

// Error state
const hasError = ref(false);
const error = ref<Error | null>(null);
const errorComponent = ref<any>(null);
const errorInfo = ref<string>('');

// Computed property for displaying error details
const errorDetails = computed(() => {
  if (!error.value) return null;
  return {
    name: error.value.name,
    message: error.value.message,
    stack: error.value.stack,
    component: errorComponent.value ? errorComponent.value.$options?.name : 'Unknown',
    info: errorInfo.value
  };
});

// Handle any errors in child components
onErrorCaptured((err, instance, info) => {
  hasError.value = true;
  error.value = err instanceof Error ? err : new Error(String(err));
  errorComponent.value = instance;
  errorInfo.value = info;
  
  // Call onError callback if provided
  if (props.onError) {
    props.onError(error.value, instance, info);
  }
  
  // Log error with our error handling utility
  handleError(err, {
    component: instance?.$options?.name || 'Unknown',
    operation: info
  }, ErrorSeverity.ERROR, {
    reportToAnalytics: true,
    logToConsole: true,
    showToUser: false
  });
  
  // Stop error propagation to parent
  return false;
});

// Handle retry button click
const handleRetry = () => {
  hasError.value = false;
  error.value = null;
  emit('retry');
};

// Handle reset button click
const handleReset = () => {
  hasError.value = false;
  error.value = null;
  emit('reset');
};
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
  color: var(--error-color, #d32f2f);
}

.error-container {
  max-width: 500px;
  padding: 2rem;
  text-align: center;
  background-color: var(--error-bg, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.error-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--error-color, #d32f2f);
}

.error-title {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-message {
  margin-bottom: 1.5rem;
  color: var(--text-color, #666);
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.retry-button,
.reset-button {
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  background-color: var(--primary-color, #2196f3);
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.retry-button:hover,
.reset-button:hover {
  background-color: var(--primary-dark, #1976d2);
}

.reset-button {
  background-color: var(--secondary-color, #757575);
}

.reset-button:hover {
  background-color: var(--secondary-dark, #616161);
}

.error-details {
  margin-top: 1.5rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: var(--text-secondary, #757575);
}

.error-details pre {
  margin-top: 0.5rem;
  padding: 1rem;
  overflow: auto;
  font-size: 0.875rem;
  background-color: var(--code-bg, #f5f5f5);
  border-radius: 4px;
  max-height: 200px;
}

/* Dark mode support */
:root.dark .error-container {
  background-color: var(--dark-bg, #333);
}

:root.dark .error-message {
  color: var(--dark-text, #bbb);
}

:root.dark .error-details pre {
  background-color: var(--dark-code-bg, #222);
}
</style>