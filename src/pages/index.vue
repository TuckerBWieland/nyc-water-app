<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import latestDate from '../generated/latest-date.js';

const router = useRouter();

onMounted(() => {
  router.replace(`/${latestDate}`);
});
</script>

<template>
  <div class="h-screen flex items-center justify-center">
    <p>If you see this page, the redirect failed.</p>
  </div>
</template>
