import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const faceApiSourcemapStripper = () => ({
  name: 'strip-face-api-sourcemaps',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    const normalizedId = id.replace(/\\/g, '/')

    if (!normalizedId.includes('/node_modules/face-api.js/build/es6/')) {
      return null
    }

    return {
      code: code.replace(/\n?\/\/# sourceMappingURL=.*$/gm, ''),
      map: null,
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [faceApiSourcemapStripper(), react()],
  optimizeDeps: {
    exclude: ['face-api.js'],
  },
})
