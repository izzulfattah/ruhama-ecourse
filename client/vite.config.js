import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fallback bawaan untuk Vite v5 (SPA React Router)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/clerk': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/stripe': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },

      '/ask': {
      target: 'http://localhost:5050',
      changeOrigin: true,
      secure: false,
      }


      
    },
    fs: {
      strict: false
    }
  },
  build: {
    rollupOptions: {
      input: 'index.html' // biar fallback ke index.html
    }
  }
})
