import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks: {
          globe: ['react-globe.gl'],
          map: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
