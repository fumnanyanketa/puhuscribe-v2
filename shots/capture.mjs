/**
 * Screenshot driver for the harness. Spawns the shots Vite server, then drives
 * the pre-installed Chromium through every page (and key sub-states), sizing
 * each capture to its content height. Writes PNGs to shots/out/.
 *
 *   node shots/capture.mjs
 *
 * Offline by design: uses the browser baked into /opt/pw-browsers and the
 * mocked Supabase client, so no network is needed.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(__dirname, 'out')
const PORT = 5199
const BASE = `http://127.0.0.1:${PORT}/shots.html`

const CHROME_CANDIDATES = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
]
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- helpers driving the page --------------------------------------------
async function clickText(page, text, opts = {}) {
  const btn = page.getByRole('button').filter({ hasText: text }).first()
  await btn.waitFor({ state: 'visible', timeout: 5000 })
  await btn.click()
  await sleep(opts.wait ?? 650)
}
async function advance(page, n) {
  for (let i = 0; i < n; i++) await clickText(page, 'Continue')
}
async function typeAndCheck(page, answer) {
  const ta = page.locator('textarea').first()
  await ta.waitFor({ state: 'visible', timeout: 5000 })
  await ta.fill(answer)
  await clickText(page, 'Check')
}

const CAPTURES = [
  { name: '01-auth', screen: 'auth' },
  { name: '02-onboarding-welcome', screen: 'onboarding' },
  { name: '03-onboarding-two-registers', screen: 'onboarding', prep: (p) => advance(p, 1) },
  { name: '04-onboarding-method', screen: 'onboarding', prep: (p) => advance(p, 2) },
  { name: '05-onboarding-journey', screen: 'onboarding', prep: (p) => advance(p, 3) },
  { name: '06-dayone-vocab-hub', screen: 'dayone' },
  { name: '07-dayone-word-card', screen: 'dayone', prep: (p) => clickText(p, 'words') },
  { name: '08-dayone-quiz', screen: 'dayone', prep: async (p) => { await clickText(p, 'words'); await clickText(p, 'Test me') } },
  { name: '09-daily-review-hub', screen: 'daily' },
  { name: '10-daily-vocab-recall', screen: 'daily', prep: (p) => clickText(p, 'Review') },
  { name: '11-daily-recall-graded', screen: 'daily', prep: async (p) => { await clickText(p, 'Review'); await typeAndCheck(p, 'talo') } },
  { name: '12-sentencebank-list', screen: 'islands' },
  { name: '13-sentencebank-new-topics', screen: 'islands', prep: (p) => clickText(p, 'Add a new set') },
  { name: '14-sentencebank-questions', screen: 'islands', prep: async (p) => { await clickText(p, 'Add a new set'); await clickText(p, 'About me') } },
  { name: '15-sentencebank-detail', screen: 'islands', prep: (p) => clickText(p, 'About me') },
  { name: '16-practice-hub', screen: 'practice' },
  { name: '17-practice-speak', screen: 'practice', prep: (p) => clickText(p, 'Speak') },
  { name: '18-listen', screen: 'listen' },
  { name: '19-listen-choose', screen: 'listen', prep: (p) => clickText(p, 'What does it mean') },
  { name: '20-write', screen: 'write' },
  { name: '21-progress', screen: 'progress' },
]

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE); if (r.ok) return } catch { /* not up yet */ }
    await sleep(500)
  }
  throw new Error('shots dev server did not start')
}

async function main() {
  if (!executablePath) throw new Error('No Chromium found under /opt/pw-browsers')
  mkdirSync(OUT, { recursive: true })

  const server = spawn('npx', ['vite', '--config', 'vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'],
    { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] })

  try {
    await waitForServer()
    const browser = await chromium.launch({
      executablePath, headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'],
    })
    const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2 })

    const results = []
    for (const cap of CAPTURES) {
      const page = await context.newPage()
      try {
        await page.goto(`${BASE}?screen=${cap.screen}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {})
        await page.waitForSelector('.ps-app-frame', { timeout: 8000 })
        await sleep(700)
        if (cap.prep) await cap.prep(page)
        await sleep(450)

        // Size the frame to its content so the floating nav sits under the page.
        const h = await page.evaluate(() => {
          const sc = document.querySelector('.ps-noscroll')
          const measured = sc ? sc.scrollHeight : (document.querySelector('.ps-app-frame')?.scrollHeight || 820)
          return Math.max(760, Math.min(2400, Math.ceil(measured)))
        })
        await page.setViewportSize({ width: 390, height: h })
        await sleep(300)

        const frame = page.locator('.ps-app-frame')
        await frame.screenshot({ path: resolve(OUT, `${cap.name}.png`) })
        results.push(`  ✓ ${cap.name}`)
      } catch (e) {
        results.push(`  ✗ ${cap.name} — ${e.message.split('\n')[0]}`)
      } finally {
        await page.close()
      }
    }
    await browser.close()
    console.log('\nCaptures:\n' + results.join('\n'))
  } finally {
    server.kill('SIGTERM')
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
