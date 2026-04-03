import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Force Vite to always resolve these to a single copy across all chunks.
  // This is the root-cause fix for "Invalid hook call / dispatcher is null"
  // errors that surface when using lazy() or any library that bundles its own
  // copy of react (e.g. react-smooth inside recharts).
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },

  // Pre-bundle React so dev server never loads a second copy from node_modules
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // All React-ecosystem packages must share a single chunk so there is
          // only ever one React runtime in the browser.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-is/') ||
            id.includes('/scheduler/') ||
            id.includes('/use-sync-external-store/') ||
            id.includes('/react-smooth/') ||
            id.includes('/react-resize-detector/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/recharts/') || id.includes('/@reduxjs/') || id.includes('/react-redux/')) {
            return 'recharts-vendor';
          }

          if (id.includes('/date-fns/')) {
            return 'date-vendor';
          }
        },
      },
    },
  },
})
