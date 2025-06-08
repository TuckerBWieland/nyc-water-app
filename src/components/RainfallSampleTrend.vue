<template>
  <div class="p-4">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

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

    const buildDatasets = () => {
      const rainfall = [];
      const good = [];
      const caution = [];
      const unsafe = [];

      for (const entry of props.history) {
        rainfall.push(entry.rainfall);
        if (isThursday(entry.date)) {
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
      const labels = props.history.map(h => h.date);
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
                  if (context.dataset.type === 'line') {
                    return `Rainfall: ${context.parsed.y} in`;
                  }
                  return `${context.dataset.label}: ${Math.round(context.parsed.y)}%`;
                },
                afterBody: ctx => {
                  const index = ctx[0].dataIndex;
                  const item = props.history[index];
                  if (!item || !isThursday(item.date)) return [];
                  const total =
                    item.sampleSummary.good +
                    item.sampleSummary.caution +
                    item.sampleSummary.unsafe;
                  return [
                    `Total samples: ${total}`,
                    `Good: ${item.sampleSummary.good}`,
                    `Caution: ${item.sampleSummary.caution}`,
                    `Unsafe: ${item.sampleSummary.unsafe}`,
                  ];
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

