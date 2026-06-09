import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Vite config for the screenshot harness only. It redirects every import of the
// real Supabase client to shots/mock-supabase.ts, so the app renders with
// fixture data offline. Run with: vite --config vite.shots.config.ts
const clientPath = resolve(__dirname, 'src/lib/supabase/client.ts')
const mockPath = resolve(__dirname, 'shots/mock-supabase.ts')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-supabase-client',
      enforce: 'pre',
      async resolveId(source, importer, options) {
        if (!importer) return null
        const r = await this.resolve(source, importer, { ...options, skipSelf: true })
        if (r && resolve(r.id) === clientPath) return mockPath
        return null
      },
    },
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
