<template>
  <div class="heatmap-container">
    <!-- Correlation Info Box -->
    <div class="correlation-info" :class="{ 'dark-mode': isDarkMode }">
      <div class="info-icon">📊</div>
      <div class="info-content">
        <strong>Key Finding: Location Matters More Than Rain</strong>
        <p>Statistical analysis reveals that <strong>WHERE you swim matters 3x more than WHEN</strong> (after rain). Location explains 20.5% of water quality variance while rainfall only explains 6.9%. Some sites are chronically polluted due to poor water circulation, nearby outfalls, or wildlife, regardless of weather.</p>
      </div>
    </div>

    <!-- Header Row -->
    <div class="heatmap-grid">
      <div class="header-cell">Date</div>
      <div class="header-cell">Rain (1-2 days prior)</div>
      <div class="header-cell">Avg Water Quality (MPN)</div>
    </div>

    <!-- Data Rows -->
    <div v-for="week in history" :key="week.date" class="heatmap-grid data-row">
      <div class="date-cell">{{ formatDate(week.date) }}</div>
      <div 
        class="value-cell rainfall-cell" 
        :style="{ backgroundColor: getRainfallColor(week.recent2DayRainfall) }"
        :title="`${week.recent2DayRainfall.toFixed(2)} inches in 1-2 days before sampling`"
      >
        {{ week.recent2DayRainfall.toFixed(2)}}″
      </div>
      <div 
        class="value-cell mpn-cell" 
        :style="{ backgroundColor: getMpnColor(week.avgMpn) }"
        :title="`Average MPN: ${Math.round(week.avgMpn)}`"
      >
        {{ Math.round(week.avgMpn) }}
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-section">
        <div class="legend-title">Rainfall 1-2 days before sampling (inches)</div>
        <div class="legend-gradient">
          <div class="gradient-bar rainfall-gradient"></div>
          <div class="gradient-labels">
            <span>0</span>
            <span>2.0+</span>
          </div>
        </div>
      </div>
      <div class="legend-section">
        <div class="legend-title">Average Water Quality (MPN bacteria count)</div>
        <div class="legend-gradient">
          <div class="gradient-bar mpn-gradient"></div>
          <div class="gradient-labels">
            <span>Good (0-35)</span>
            <span>Unsafe (200+)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    history: {
      type: Array,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Color scale for rainfall (light blue to dark blue)
const getRainfallColor = (rainfall) => {
  // Max rainfall for scaling - adjusted for 1-2 day window
  const maxRainfall = 2.0; // Lower max since it's only 2 days
  const normalized = Math.min(rainfall / maxRainfall, 1);
  
  // HSL: light blue to dark blue
  const lightness = 85 - (normalized * 50); // 85% (very light) to 35% (dark)
  return `hsl(210, 100%, ${lightness}%)`;
};

// Color scale for MPN (green → yellow → red)
const getMpnColor = (mpn) => {
  if (mpn <= 35) {
    // Good: shades of green
    const intensity = mpn / 35;
    const lightness = 75 - (intensity * 25); // 75% (light green) to 50% (darker green)
    return `hsl(140, 70%, ${lightness}%)`;
  } else if (mpn <= 104) {
    // Caution: green to yellow to orange
    const range = 104 - 35;
    const position = (mpn - 35) / range;
    // Hue: 140 (green) → 45 (yellow) → 30 (orange)
    const hue = 140 - (position * 110);
    const lightness = 70 - (position * 15);
    return `hsl(${hue}, 80%, ${lightness}%)`;
  } else {
    // Unsafe: orange to red
    const position = Math.min((mpn - 104) / 200, 1); // Cap at 304 for color scaling
    const hue = 30 - (position * 25); // 30 (orange) → 5 (red)
    const lightness = 55 - (position * 10); // Darker as it gets worse
    return `hsl(${hue}, 85%, ${lightness}%)`;
  }
};
</script>

<style scoped>
.heatmap-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.correlation-info {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 4px solid rgb(59, 130, 246);
  border-radius: 0.5rem;
}

/* Dark mode styles */
.correlation-info.dark-mode {
  background-color: rgba(30, 58, 138, 0.3);
  border-left-color: rgb(147, 197, 253);
}

.correlation-info.dark-mode .info-content strong {
  color: rgb(255, 255, 255);
}

.correlation-info.dark-mode .info-content p {
  color: rgb(229, 231, 235);
}

.info-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.info-content {
  flex: 1;
}

.info-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: rgb(30, 64, 175);
}

.info-content p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: inherit; /* Inherit parent text color for consistency */
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 100px 1fr 1fr;
  gap: 2px;
  margin-bottom: 2px;
}

.header-cell {
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 0.85rem;
}

:global(.dark) .header-cell {
  background-color: rgba(255, 255, 255, 0.1);
}

.data-row {
  transition: transform 0.15s ease;
}

.data-row:hover {
  transform: scale(1.02);
  z-index: 10;
}

.date-cell {
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.875rem;
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.dark) .date-cell {
  background-color: rgba(255, 255, 255, 0.05);
}

.value-cell {
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  cursor: help;
  transition: opacity 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.85);
}

.value-cell:hover {
  opacity: 0.85;
}

/* Legend */
.legend {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
}

:global(.dark) .legend {
  background-color: rgba(255, 255, 255, 0.05);
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.legend-gradient {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gradient-bar {
  height: 20px;
  border-radius: 4px;
}

.rainfall-gradient {
  background: linear-gradient(to right, hsl(210, 100%, 85%), hsl(210, 100%, 35%));
}

.mpn-gradient {
  background: linear-gradient(to right, 
    hsl(140, 70%, 75%),   /* Good: light green */
    hsl(140, 70%, 50%),   /* Good: darker green */
    hsl(90, 80%, 55%),    /* Transitioning */
    hsl(45, 80%, 55%),    /* Caution: yellow */
    hsl(30, 85%, 55%),    /* Orange */
    hsl(5, 85%, 45%)      /* Unsafe: red */
  );
}

.gradient-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 640px) {
  .heatmap-grid {
    grid-template-columns: 80px 1fr 1fr;
    gap: 1px;
  }
  
  .header-cell,
  .date-cell {
    font-size: 0.75rem;
    padding: 0.5rem 0.25rem;
  }
  
  .value-cell {
    font-size: 0.875rem;
    padding: 0.75rem 0.25rem;
  }
}
</style>