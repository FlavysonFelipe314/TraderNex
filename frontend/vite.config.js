import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true, // Necessário para hot reload funcionar no Docker
    },
    proxy: {
      '/api': {
        target: 'http://backend:5000', // No Docker, use o nome do serviço
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Não reescrever o path, manter /api
      },
    },
  },
  // Configuração para SPA - importante para roteamento
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
