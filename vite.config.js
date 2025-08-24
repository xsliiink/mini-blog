import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // все запросы, начинающиеся с /posts, будут проксироваться на http://localhost:3001
      '/posts': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
    },
  },
})
