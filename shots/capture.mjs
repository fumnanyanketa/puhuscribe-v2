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
  for (let i = 0; i < n; i++) await clickText(page, 'Jatka')
}
async function typeAndCheck(page, answer) {
  const ta = page.locator('textarea').first()
  await ta.waitFor({ state: 'visible', timeout: 5000 })
  await ta.fill(answer)
  await clickText(page, 'Tarkista')
}

// name · screen (+query) · optional interactions
const CAPTURES = [
  { name: '01-auth', screen: 'auth' },
  { name: '02-onboarding-welcome', screen: 'onboarding' },
  { name: '03-onboarding-two-registers', screen: 'onboarding', prep: (p) => advance(p, 1) },
  { name: '04-onboarding-method', screen: 'onboarding', prep: (p) => advance(p, 2) },
  { name: '05-onboarding-journey', screen: 'onboarding', prep: (p) => advance(p, 3) },
  { name: '06-home-sprint-open', screen: 'home', query: '&sprint=open' },
  { name: '07-home-hub', screen: 'home' },
  { name: '08-sprint-intro', screen: 'learn', query: '&sprint=open&intro=1' }, // intro shows pre-completion on Learn
  { name: '09-sprint-word-card', screen: 'dayone', query: '&sprint=open' },
  { name: '10-sprint-quiz', screen: 'dayone', query: '&sprint=open', prep: (p) => clickText(p, 'Testaa minua') },
  { name: '11-learn-daily-vocab', screen: 'learn' },
  { name: '12-review-hub', screen: 'daily' },
  { name: '13-review-recall', screen: 'daily', prep: (p) => clickText(p, 'Kertaa') },
  { name: '14-review-recall-graded', screen: 'daily', prep: async (p) => { await clickText(p, 'Kertaa'); await typeAndCheck(p, 'olla') } },
  { name: '15-sentencebank-list', screen: 'islands' },
  { name: '16-sentencebank-topics', screen: 'islands', prep: (p) => clickText(p, 'Uusi setti') },
  { name: '17-sentencebank-questions', screen: 'islands', prep: async (p) => {
    await clickText(p, 'Uusi setti'); await clickText(p, 'Minä'); await clickText(p, 'Jatka') } },
  { name: '18-sentencebank-detail', screen: 'islands', prep: (p) => clickText(p, 'About me') },
  { name: '19-practice-hub', screen: 'practice' },
  { name: '20-practice-speak', screen: 'practice', prep: (p) => clickText(p, 'Puhuminen') },
  { name: '21-practice-listen', screen: 'listen' },
  { name: '22-practice-listen-choose', screen: 'listen', prep: async (p) => {
    await typeAndCheck(p, 'Minä olen kotona'); await clickText(p, 'Seuraava') } },
  { name: '23-practice-read', screen: 'read' },
  { name: '24-practice-write', screen: 'write' },
  { name: '25-progress', screen: 'progress' },
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
        // The app caches progress in localStorage; clear it so each capture's
        // ?sprint= state is honoured rather than merged with a previous page's.
        await page.addInitScript(() => { try { localStorage.clear() } catch { /* ignore */ } })
        await page.goto(`${BASE}?screen=${cap.screen}${cap.query ?? ''}`, { waitUntil: 'networkidle' })
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
        results.push(`  OK ${cap.name}`)
      } catch (e) {
        results.push(`  FAIL ${cap.name} -- ${e.message.split('\n')[0]}`)
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
