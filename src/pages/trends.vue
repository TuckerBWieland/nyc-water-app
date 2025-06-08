<script setup>
import RainfallSampleTrend from '../components/RainfallSampleTrend.vue';

const mockData = [
  { date: '2024-06-06', rainfall: 0.4, sampleSummary: { good: 12, caution: 4, unsafe: 6 } },
  { date: '2024-06-07', rainfall: 0.1, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-08', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-09', rainfall: 0.2, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-10', rainfall: 0.3, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-11', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-12', rainfall: 0.5, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-13', rainfall: 0.6, sampleSummary: { good: 10, caution: 5, unsafe: 7 } },
  { date: '2024-06-14', rainfall: 0.2, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-15', rainfall: 0.1, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-16', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-17', rainfall: 0.3, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-18', rainfall: 0.4, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-19', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-20', rainfall: 0.7, sampleSummary: { good: 8, caution: 8, unsafe: 6 } },
  { date: '2024-06-21', rainfall: 0.1, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-22', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-23', rainfall: 0.4, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-24', rainfall: 0.6, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-25', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-26', rainfall: 0.3, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-27', rainfall: 0.5, sampleSummary: { good: 11, caution: 6, unsafe: 7 } },
  { date: '2024-06-28', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-29', rainfall: 0.2, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-06-30', rainfall: 0.1, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-07-01', rainfall: 0.0, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-07-02', rainfall: 0.4, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-07-03', rainfall: 0.5, sampleSummary: { good: 0, caution: 0, unsafe: 0 } },
  { date: '2024-07-04', rainfall: 0.8, sampleSummary: { good: 9, caution: 7, unsafe: 8 } },
];
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <RainfallSampleTrend :history="mockData" />
  </div>
</template>

