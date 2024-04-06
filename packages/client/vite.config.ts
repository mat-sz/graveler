import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode.includes('production');

  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
    },
    build: {
      assetsInlineLimit: 0,
      outDir: 'dist',
    },
    plugins: [react()],
    resolve: {
      ...(isProduction
        ? {
            // Enables MobX production build
            mainFields: ['jsnext:main', 'module', 'main'],
          }
        : {}),
      alias: {
        $: path.resolve(__dirname, './src'),
      },
    },
  };
});
