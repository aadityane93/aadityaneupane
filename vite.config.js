import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

export default defineConfig({
  plugins: [react(), {
    name: 'static-host-config',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'staticwebapp.config.json',
        source: readFileSync(new URL('./staticwebapp.config.json', import.meta.url), 'utf8'),
      });
    },
  }],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Keep dependency URLs stable when application code changes. This
        // chunk is still fetched only by the deferred application import.
        manualChunks(id) {
          if (id.replaceAll('\\', '/').includes('/node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  base: '/',
});
