import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

console.log('[build:vercel] Compilando frontend (Vite + singlefile)...')
execSync('npx vite build --config src/frontend/vite.vercel.config.ts', {
  stdio: 'inherit',
  cwd: root,
})

const htmlPath = path.join(root, 'public', 'index.html')
const html = fs.readFileSync(htmlPath, 'utf-8')

const generatedPath = path.join(root, 'src', 'vercel-html.generated.ts')
fs.writeFileSync(
  generatedPath,
  `// Archivo GENERADO por scripts/build.vercel.mjs. No editar manualmente.\nexport const vercelHtml: string = ${JSON.stringify(html)};\n`,
)

console.log('[build:vercel] SPA autocontenida inyectada en src/vercel-html.generated.ts')
console.log('[build:vercel] Listo. Despliega en Vercel (preset Hono).')