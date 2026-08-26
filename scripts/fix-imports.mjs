import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const KNOWN_EXT =
  /\.(js|jsx|ts|tsx|mjs|cjs|json|css|scss|sass|less|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|eot|map)$/

function rewriteSpecifier(spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return spec
  if (KNOWN_EXT.test(spec)) return spec
  return `${spec}.js`
}

let changed = 0

for (const file of walk(srcDir)) {
  const original = fs.readFileSync(file, 'utf-8')
  let content = original

  content = content.replace(
    /(\bfrom\s+)(['"])(\.\.?\/[^'"]+)(['"])/g,
    (m, pre, q, spec, q2) => `${pre}${q}${rewriteSpecifier(spec)}${q2}`,
  )

  content = content.replace(
    /(^|[;\s])(import\s+)(['"])(\.\.?\/[^'"]+)(['"])/g,
    (m, pre, imp, q, spec, q2) => `${pre}${imp}${q}${rewriteSpecifier(spec)}${q2}`,
  )

  content = content.replace(
    /(\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]+)(['"])/g,
    (m, pre, q, spec, q2) => `${pre}${q}${rewriteSpecifier(spec)}${q2}`,
  )

  if (content !== original) {
    fs.writeFileSync(file, content)
    changed += 1
    console.log(`[fix-imports] ${path.relative(root, file)}`)
  }
}

console.log(`[fix-imports] ${changed} archivo(s) actualizado(s).`)