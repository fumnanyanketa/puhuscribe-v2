// Rasterise public/icon.svg into the PNG sizes PWAs / iOS need.
// sharp is intentionally NOT a project dependency (keeps Vercel builds lean).
// Run on demand:  npm i sharp --no-save && node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const svg = readFileSync(resolve(pub, 'icon.svg'))

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180], // iOS ignores SVG home-screen icons; needs a PNG
]

for (const [name, size] of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(resolve(pub, name))
  console.log(`wrote public/${name} (${size}x${size})`)
}
