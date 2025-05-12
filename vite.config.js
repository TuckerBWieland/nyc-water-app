import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/nyc-water-app/',
  plugins: [vue()],
});
