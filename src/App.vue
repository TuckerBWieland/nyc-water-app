<template>
  <router-view />
</template>

<script setup>
import { useScreenSize } from './composables/useScreenSize';

// Initialize global screen size tracking
useScreenSize();
</script>
