import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // HAPUS manifest untuk SPA deployment
    outDir: 'dist',
    rollupOptions: {
      // HAPUS custom input - biarkan Vite gunakan index.html default
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@headlessui/react',
            '@heroicons/react', 
            'lucide-react',
            'react-hot-toast',
            'react-confetti'
          ],
          auth: [
            '@react-oauth/google',
            'jwt-decode',
            'react-google-recaptcha'
          ],
          utils: ['axios', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Rails backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
})