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
  server: {
    watch: {
      // Limit watched paths to src/ — skip node_modules entirely to avoid CPU spikes
      ignored: ['**/node_modules/**', '**/dist/**'],
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        selfHandleResponse: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept-Encoding', 'identity');
          });
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['x-accel-buffering'] = 'no';
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            } else {
              let body = Buffer.alloc(0);
              proxyRes.on('data', (chunk) => { body = Buffer.concat([body, chunk]); });
              proxyRes.on('end', () => {
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                res.end(body);
              });
            }
          });
        },
      },
    },
  },
})
