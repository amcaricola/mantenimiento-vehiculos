import { build } from 'esbuild'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

console.log('[build] Compilando frontend (Vite + Preact + Tailwind)...')
execSync('npx vite build --config src/frontend/vite.config.ts', {
  stdio: 'inherit',
  cwd: root,
})

console.log('[build] Compilando backend (esbuild)...')
await build({
  entryPoints: [path.join(root, 'src/backend/server.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(root, 'dist/server/index.js'),
  sourcemap: false,
  minify: false,
  external: ['@vercel/blob'],
})

console.log('[build] Completado. Ejecuta "npm start" para iniciar el servidor.')