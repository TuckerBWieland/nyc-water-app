import { onMounted, onUnmounted } from 'vue';

/**
 * Debug click events in production to identify issues with popup buttons
 */
export function useClickDebug() {
  const handleGlobalClick = (e) => {
    // Only log in production if there's a debug flag
    if (window.location.search.includes('debug=clicks')) {
      const target = e.target;
      const clickInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        title: target.title,
        computedStyles: {
          position: getComputedStyle(target).position,
          zIndex: getComputedStyle(target).zIndex,
          pointerEvents: getComputedStyle(target).pointerEvents,
          display: getComputedStyle(target).display,
          visibility: getComputedStyle(target).visibility,
        },
        boundingRect: target.getBoundingClientRect(),
        timestamp: new Date().toISOString()
      };
      
      console.log('Click event captured:', clickInfo);
      
      // Check if this is one of our popup buttons
      if (target.title === 'Information' || target.title === 'Data information' || target.title === 'Donate') {
        console.log('Popup button clicked!', target.title);
      }
    }
  };

  onMounted(() => {
    if (window.location.search.includes('debug=clicks')) {
      document.addEventListener('click', handleGlobalClick, true);
      console.log('Click debugging enabled');
    }
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick, true);
  });
}
