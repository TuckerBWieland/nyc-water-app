import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nyc-water-app/',
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
});
