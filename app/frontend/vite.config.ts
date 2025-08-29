import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom'],
          
          // Routing and navigation
          router: ['react-router-dom'],
          
          // UI component libraries
          ui: ['@headlessui/react', '@heroicons/react', 'lucide-react'],
          
          // Utility libraries
          utils: ['date-fns', 'jwt-decode', 'axios'],
          
          // Authentication and external services
          auth: ['@react-oauth/google', 'react-google-recaptcha'],
          
          // Toast and animations
          animations: ['react-hot-toast', 'react-confetti']
        }
      }
    },
    emptyOutDir: true,
    copyPublicDir: true,
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        xfwd: true,
        cookieDomainRewrite: 'localhost',
        ws: true,
      },
      '/rails': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/assets': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})