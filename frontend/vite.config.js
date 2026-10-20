import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/api-docs': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three-vendor'
          if (id.includes('/node_modules/@react-three/fiber/')) return 'fiber-vendor'
          if (id.includes('/node_modules/@react-three/drei/') || id.includes('/node_modules/three-stdlib/')) return 'drei-vendor'
          if (id.includes('/node_modules/@react-three/postprocessing/') || id.includes('/node_modules/postprocessing/')) return 'postprocessing-vendor'
          if (id.includes('/node_modules/howler/')) return 'audio-vendor'
        },
      },
    },
  },
})
