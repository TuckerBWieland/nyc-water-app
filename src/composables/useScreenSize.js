import { ref, onMounted, onUnmounted } from 'vue';

// Global reactive flag for mobile screens
export const isMobile = ref(false);

function update() {
  isMobile.value = window.innerWidth < 768;
}

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
