import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [vue()],
  clearScreen: false,
  resolve: {
    alias: {
      '@statesync/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@statesync/tauri': resolve(__dirname, '../../packages/tauri/src/index.ts'),
    },
  },
  server: {
    host: host || false,
    port: Number(process.env.PORT || 3320),
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        benchmark: resolve(__dirname, 'benchmark.html'),
      },
    },
  },
});
