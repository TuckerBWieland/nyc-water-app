<template>
  <div class="p-4">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';

export default {
  name: 'RainfallSampleTrend',
  props: {
    history: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref(null);
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

    const buildDatasets = () => {
      const rainfall = [];
      const good = [];
      const caution = [];
      const unsafe = [];

      for (const entry of flattened.value) {
        rainfall.push(entry.rainfall);
        if (entry.sampleSummary) {
          const total =
            entry.sampleSummary.good +
            entry.sampleSummary.caution +
            entry.sampleSummary.unsafe;
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
            title: {
              display: true,
              text: 'Rainfall + Weekly Water Quality Breakdown',
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
                  const count = entry.sampleSummary[
                    context.dataset.label.toLowerCase()
                  ];
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
                callback: (val, idx) => {
                  const label = labels[idx];
                  if (isThursday(label)) {
                    const [y, m, d] = label.split('-');
                    return `${m}/${d}`;
                  }
                  return '';
                },
              },
            },
            yRain: {
              position: 'left',
              title: {
                display: true,
                text: 'Rainfall (in)',
              },
            },
            ySample: {
              position: 'right',
              min: 0,
              max: 100,
              title: {
                display: true,
                text: 'Sample Results (%)',
              },
              ticks: {
                callback: value => `${value}%`,
              },
            },
          },
        },
      });
    };

    onMounted(createChart);

    watch(
      () => props.history,
      () => {
        if (chartInstance) {
          chartInstance.destroy();
        }
        createChart();
      },
      { deep: true }
    );

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return { chartCanvas };
  },
};
</script>

<style scoped>
canvas {
  max-height: 300px;
}
</style>

