import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        // En desarrollo se permite abrir Vite desde otros equipos de la LAN.
        // La llamada sigue siendo same-origin en el navegador; normalizamos el
        // Origin solo en el salto interno hacia el gateway/Spring.
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:5173')
          })
        },
      },
      '/api-docs': {
        target: 'http://localhost:3000',
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:5173')
          })
        },
      },
    },
  },
  build: {
    // PixiJS's core is intentionally kept atomic to avoid cyclic renderer/scene chunks.
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/pixi-filters/')) return 'pixi-filters-vendor'
          if (id.includes('/node_modules/pixi.js/')) return 'pixi-vendor'
          if (id.includes('/node_modules/three/')) return 'three-vendor'
          if (id.includes('/node_modules/@react-three/fiber/')) return 'fiber-vendor'
          if (id.includes('/node_modules/@react-three/drei/') || id.includes('/node_modules/three-stdlib/')) return 'drei-vendor'
          if (id.includes('/node_modules/@react-three/postprocessing/') || id.includes('/node_modules/postprocessing/')) return 'postprocessing-vendor'
          if (id.includes('/node_modules/howler/')) return 'audio-vendor'
          if (id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/motion-dom/') || id.includes('/node_modules/motion-utils/')) return 'motion-vendor'
        },
      },
    },
  },
})
