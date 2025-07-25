<template>
  <div class="relative">
    <div ref="scrollContainer" class="p-4 relative overflow-x-auto">
      <div class="min-w-[600px] w-full h-80">
        <canvas ref="chartCanvas" class="w-full h-full"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
} from 'chart.js';

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
    const axesCanvas = ref(null);
    const scrollContainer = ref(null);
    let chartInstance = null;

    const isThursday = dateStr => {
      const d = new Date(dateStr + 'T00:00:00Z');
      return d.getUTCDay() === 4; // Thursday
    };

    // Register Chart.js components
    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      Title,
      Tooltip,
      Legend,
      LineController,
      BarController
    );

    const flattened = computed(() => {
      const map = new Map();
      for (const week of props.history) {
        const base = new Date(week.date + 'T00:00:00Z');
        const rain = week.rainfallByDay || [];
        
        // Process each day in the rainfall data
        for (let i = 0; i < rain.length; i++) {
          const d = new Date(base);
          d.setUTCDate(d.getUTCDate() - (rain.length - 1 - i));
          const key = d.toISOString().slice(0, 10);
          if (!map.has(key)) {
            map.set(key, {
              date: key,
              rainfall: rain[i] || 0,
              sampleSummary: i === (rain.length - 1) ? week.sampleSummary : null,
            });
          }
        }
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    });


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

    /**
     * Chart.js plugin that draws static axes on an overlay canvas.
     *
     * @param {Chart} chart - Chart instance being drawn.
     * @returns {void}
     */
    const overlayAxesPlugin = {
      id: 'overlayAxes',
      afterDraw(chart) {
        const canvas = axesCanvas.value;
        const sc = scrollContainer.value;
        if (!canvas || !sc) return;
        const ctx = canvas.getContext('2d');
        const { chartArea, scales } = chart;
        canvas.width = sc.clientWidth;
        canvas.height = chartCanvas.value.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(chartArea.left - sc.scrollLeft, 0);
        if (ChartJS?.defaults?.font?.string) {
          ctx.font = ChartJS.defaults.font.string;
        }
        const textColor = props.isDarkMode ? '#e5e7eb' : '#1f2937';
        ctx.strokeStyle = textColor;
        ctx.fillStyle = textColor;
        ctx.lineWidth = 1;
        const x = scales.x;
        ctx.beginPath();
        ctx.moveTo(0, chartArea.bottom);
        ctx.lineTo(chartArea.right - chartArea.left, chartArea.bottom);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Use the loop index when converting ticks to pixel positions so that
        // labels stay aligned while the chart scrolls.
        x.ticks.forEach((t, idx) => {
          const pos = x.getPixelForTick(idx) - chartArea.left;
          ctx.beginPath();
          ctx.moveTo(pos, chartArea.bottom);
          ctx.lineTo(pos, chartArea.bottom + 4);
          ctx.stroke();
          ctx.fillText(t.label, pos, chartArea.bottom + 6);
        });
        ctx.textBaseline = 'middle';
        const yL = scales.yRain;
        ctx.textAlign = 'right';
        yL.ticks.forEach(t => {
          const pos = yL.getPixelForValue(t.value);
          ctx.beginPath();
          ctx.moveTo(-4, pos);
          ctx.lineTo(0, pos);
          ctx.stroke();
          ctx.fillText(t.label, -6, pos);
        });
        const yR = scales.ySample;
        ctx.textAlign = 'left';
        yR.ticks.forEach(t => {
          const pos = yR.getPixelForValue(t.value);
          ctx.beginPath();
          ctx.moveTo(chartArea.right - chartArea.left, pos);
          ctx.lineTo(chartArea.right - chartArea.left + 4, pos);
          ctx.stroke();
          ctx.fillText(t.label, chartArea.right - chartArea.left + 6, pos);
        });
        ctx.restore();
      },
    };

    // Memoize expensive chart options calculation
    const chartOptions = computed(() => {
      const textColor = props.isDarkMode ? '#e5e7eb' : '#1f2937';
      const gridColor = props.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)';
      
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' },
        animation: {
          duration: 400, // Reduced from 800 for better performance
          easing: 'easeInOutCubic',
        },
        plugins: {
          legend: { display: false },
          title: {
            display: false,
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
          ySample: {
            type: 'linear',
            stacked: true,
            position: 'left',
            beginAtZero: true,
            max: 100,
            ticks: { color: textColor },
            grid: { color: gridColor },
            title: {
              display: true,
              text: 'Sample Quality (%)',
              color: textColor,
              font: { size: 10 },
            },
          },
          yRain: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            ticks: { color: textColor },
            grid: { display: false },
            title: {
              display: true,
              text: 'Rainfall (in)',
              color: textColor,
              font: { size: 10 },
            },
          },
          x: {
            ticks: {
              color: textColor,
              maxTicksLimit: 12,
              callback: function (value, index) {
                const date = this.getLabelForValue(value);
                const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();
                return dayOfWeek === 4 ? date.slice(5) : '';
              },
            },
            grid: { color: gridColor },
          },
        },
      };
    });

    // Debounce chart creation to prevent rapid re-renders
    let chartCreationTimeout = null;
    
    const debouncedCreateChart = (delay = 100) => {
      if (chartCreationTimeout) {
        clearTimeout(chartCreationTimeout);
      }
      chartCreationTimeout = setTimeout(async () => {
        await createChart();
      }, delay);
    };

    /**
     * Initialize the rainfall and sample results chart.
     *
     * @returns {Promise<void>} Resolves when the chart has been created.
     */
    const createChart = async () => {
      if (!chartCanvas.value) {
        console.warn('Chart canvas not available');
        return;
      }
      
      if (props.history.length === 0) {
        console.warn('No history data available for chart');
        return;
      }
      
      // Destroy existing chart if it exists
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      
      try {
        // ChartJS.register(overlayAxesPlugin); // Temporarily disable custom plugin
        const ctx = chartCanvas.value.getContext('2d');
        const labels = flattened.value.map(h => h.date);
        const { rainfall, good, caution, unsafe } = buildDatasets();

        chartInstance = new ChartJS(ctx, {
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
          options: chartOptions.value,
        });
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    };

    /**
     * Redraws the chart as the container scrolls so the overlay axes stay aligned.
     *
     * @returns {void}
     */
    const onScroll = () => {
      if (chartInstance) chartInstance.draw();
    };

    onMounted(async () => {
      await nextTick();
      await createChart();
      scrollToLatest();
      scrollContainer.value.addEventListener('scroll', onScroll);
    });

    watch(
      () => props.history,
      async () => {
        debouncedCreateChart();
        scrollToLatest();
      },
      { deep: true }
    );

    watch(
      () => props.isDarkMode,
      async () => {
        debouncedCreateChart();
      }
    );

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      if (scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', onScroll);
      }
      // Clean up debounce timeout
      if (chartCreationTimeout) {
        clearTimeout(chartCreationTimeout);
      }
    });

    return { chartCanvas, axesCanvas, scrollContainer };
  },
};
</script>

<style scoped>
canvas {
  max-height: 300px;
}
</style>
