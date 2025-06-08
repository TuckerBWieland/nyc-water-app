<template>
  <div class="relative">
    <div
      class="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-left pointer-events-none text-sm"
      :class="isDarkMode ? 'text-gray-200' : 'text-gray-700'"
    >
      Rainfall (in)
    </div>
    <div
      class="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right pointer-events-none text-sm"
      :class="isDarkMode ? 'text-gray-200' : 'text-gray-700'"
    >
      Sample Results (%)
    </div>
    <div ref="scrollContainer" class="overflow-x-auto p-4">
      <div class="min-w-[600px]" :style="{ width: canvasWidth + 'px' }">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';

export default {
  name: 'RainfallSampleTrend',
  props: {
    history: {
      type: Array,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
    const scrollContainer = ref(null);
    let chartInstance = null;

    const isThursday = dateStr => {
      const d = new Date(dateStr + 'T00:00:00Z');
      return d.getUTCDay() === 4; // Thursday
    };

    const loadChartJs = async () => {
      if (!window.Chart) {
        await import('https://cdn.jsdelivr.net/npm/chart.js');
      }
      return window.Chart;
    };

    const flattened = computed(() => {
      const map = new Map();
      for (const week of props.history) {
        const base = new Date(week.date + 'T00:00:00Z');
        const rain = week.rainfallByDay || [];
        for (let i = rain.length - 1; i >= 0; i--) {
          const d = new Date(base);
          d.setUTCDate(d.getUTCDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (!map.has(key)) {
            map.set(key, {
              date: key,
              rainfall: rain[i],
              sampleSummary: i === 0 ? week.sampleSummary : null,
            });
          }
        }
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    });

    const canvasWidth = computed(() => flattened.value.length * 30);

    const scrollToLatest = () => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth;
      }
    };

    const buildDatasets = () => {
      const rainfall = [];
      const good = [];
      const caution = [];
      const unsafe = [];

      for (const entry of flattened.value) {
        rainfall.push(entry.rainfall);
        if (entry.sampleSummary) {
          const total =
            entry.sampleSummary.good + entry.sampleSummary.caution + entry.sampleSummary.unsafe;
          good.push((entry.sampleSummary.good / total) * 100);
          caution.push((entry.sampleSummary.caution / total) * 100);
          unsafe.push((entry.sampleSummary.unsafe / total) * 100);
        } else {
          good.push(null);
          caution.push(null);
          unsafe.push(null);
        }
      }

      return { rainfall, good, caution, unsafe };
    };

    const createChart = async () => {
      const Chart = await loadChartJs();
      const ctx = chartCanvas.value.getContext('2d');
      const labels = flattened.value.map(h => h.date);
      const { rainfall, good, caution, unsafe } = buildDatasets();
      const textColor = props.isDarkMode ? '#e5e7eb' : '#1f2937';
      const gridColor = props.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)';

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Rainfall (in)',
              data: rainfall,
              borderColor: '#3b82f6',
              backgroundColor: '#3b82f6',
              yAxisID: 'yRain',
              tension: 0.3,
            },
            {
              type: 'bar',
              label: 'Good',
              data: good,
              backgroundColor: '#16a34a',
              stack: 'samples',
              yAxisID: 'ySample',
            },
            {
              type: 'bar',
              label: 'Caution',
              data: caution,
              backgroundColor: '#eab308',
              stack: 'samples',
              yAxisID: 'ySample',
            },
            {
              type: 'bar',
              label: 'Unsafe',
              data: unsafe,
              backgroundColor: '#dc2626',
              stack: 'samples',
              yAxisID: 'ySample',
            },
          ],
        },
        options: {
          responsive: true,
          interaction: { mode: 'index' },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Rainfall + Weekly Water Quality Breakdown',
              color: textColor,
            },
            tooltip: {
              callbacks: {
                label: context => {
                  const entry = flattened.value[context.dataIndex];
                  if (context.dataset.type === 'line') {
                    return `Rainfall: ${context.parsed.y} in`;
                  }
                  if (!entry || !entry.sampleSummary) return '';
                  const total =
                    entry.sampleSummary.good +
                    entry.sampleSummary.caution +
                    entry.sampleSummary.unsafe;
                  const count = entry.sampleSummary[context.dataset.label.toLowerCase()];
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return `${context.dataset.label}: ${count} (${pct}%)`;
                },
                afterBody: ctx => {
                  const entry = flattened.value[ctx[0].dataIndex];
                  if (!entry || !entry.sampleSummary) return [];
                  const total =
                    entry.sampleSummary.good +
                    entry.sampleSummary.caution +
                    entry.sampleSummary.unsafe;
                  return [`Total samples: ${total}`];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: textColor,
                callback: (val, idx) => {
                  const label = labels[idx];
                  if (isThursday(label)) {
                    const [y, m, d] = label.split('-');
                    return `${m}/${d}`;
                  }
                  return '';
                },
              },
              grid: { color: gridColor, drawBorder: false, lineWidth: 0.5 },
            },
            yRain: {
              position: 'left',
              title: {
                display: false,
              },
              ticks: { color: textColor },
              grid: { color: gridColor, drawBorder: false, lineWidth: 0.5 },
            },
            ySample: {
              position: 'right',
              min: 0,
              max: 100,
              title: {
                display: false,
              },
              ticks: {
                callback: value => `${value}%`,
                color: textColor,
              },
              grid: { color: gridColor, drawBorder: false, lineWidth: 0.5 },
            },
          },
        },
      });
    };

    onMounted(async () => {
      await nextTick();
      await createChart();
      scrollToLatest();
    });

    watch(
      () => props.history,
      () => {
        if (chartInstance) {
          chartInstance.destroy();
        }
        createChart();
        scrollToLatest();
      },
      { deep: true }
    );

    watch(
      () => props.isDarkMode,
      () => {
        if (chartInstance) {
          chartInstance.destroy();
        }
        createChart();
      }
    );

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return { chartCanvas, scrollContainer, canvasWidth };
  },
};
</script>

<style scoped>
canvas {
  max-height: 300px;
}
</style>
