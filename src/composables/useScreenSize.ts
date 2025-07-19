import { ref, onMounted, onUnmounted } from 'vue';

// Global reactive flag for mobile screens
export const isMobile = ref(false);

/**
 * Update the global mobile flag based on the current screen width.
 */
function update() {
  isMobile.value = window.innerWidth < 768;
}
/**
 * Reactive utility that tracks whether the screen is considered mobile.
 *
 * @returns {{ isMobile: import('vue').Ref<boolean> }} Reactive mobile flag.
 */
export function useScreenSize() {
  onMounted(() => {
    update();
    window.addEventListener('resize', update);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
  });

  return { isMobile };
}
