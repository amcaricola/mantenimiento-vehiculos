import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: dir,
  plugins: [preact()],
  publicDir: false,
  resolve: {
    alias: {
      '@shared': path.resolve(dir, '../shared'),
      '@': path.resolve(dir, 'src'),
    },
  },
  build: {
    outDir: path.resolve(dir, '../../public'),
    emptyOutDir: true,
    sourcemap: false,
  },
})