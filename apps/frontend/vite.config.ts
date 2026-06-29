import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'face-api.js': path.resolve(__dirname, 'node_modules/face-api.js/build/es6/index.js'),
    },
  },
  optimizeDeps: {
    include: ['face-api.js', '@tensorflow/tfjs-core'],
  },
})
