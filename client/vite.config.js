import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { minifyStatic } from './plugins/minify-static.js'

const apiTarget = process.env.API_URL ?? 'http://localhost:3001'

// Vite's string shorthand ('/api': 'http://...') silently enables changeOrigin, which rewrites the
// Host header to the API's own host. Keep the browser's original Host so the API sees the same
// address the page was opened from (http://<lan-ip>:5173 from a phone, for example).
const proxy = { '/api': { target: apiTarget, changeOrigin: false } }

export default defineConfig({
  plugins: [react(), minifyStatic()],
  server: { host: true, port: 5173, proxy },
  preview: { host: true, port: 4173, proxy },
  build: {
    minify: true,
    cssMinify: true,
    // dist/css, dist/js, dist/assets — the same folder layout as the source tree (src/css, src/js, src/assets)
    rolldownOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (asset) =>
          (asset.names ?? []).some((name) => name.endsWith('.css'))
            ? 'css/[name]-[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
