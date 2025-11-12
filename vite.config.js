// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                 // Netlify için kök
  define: {
    'process.env': {},       // bazı paketler için env polyfill
    global: 'window',        // global polyfill
  },
})
