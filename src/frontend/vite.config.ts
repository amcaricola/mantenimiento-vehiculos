import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir)

export default defineConfig({
  root,
  plugins: [preact()],
  resolve: {
    alias: {
      '@shared': path.resolve(dir, '../shared'),
      '@': path.resolve(dir, 'src'),
    },
  },
  build: {
    outDir: path.resolve(dir, '../../dist'),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})