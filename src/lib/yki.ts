/**
 * The four YKI exam skills. The YKI (Yleinen kielitutkinto) grades speaking,
 * listening, reading and writing separately, so every activity in the app is
 * tagged with the skill it trains — making the four-skill coverage visible,
 * which is the core differentiator vs. vocabulary-only apps.
 */
export type YkiSkill = 'speak' | 'listen' | 'read' | 'write'

export const YKI: Record<YkiSkill, { fi: string; en: string; color: string; bg: string }> = {
  speak:  { fi: 'Puhuminen', en: 'Speaking',  color: 'var(--spoken)',  bg: 'var(--spoken-bg)' },
  listen: { fi: 'Kuuntelu',  en: 'Listening', color: 'var(--flag)',    bg: 'var(--flag-bg)' },
  read:   { fi: 'Lukeminen', en: 'Reading',   color: 'var(--written)', bg: 'var(--written-bg)' },
  write:  { fi: 'Kirjoitus', en: 'Writing',   color: '#C2603F',        bg: 'rgba(194,96,63,0.12)' },
}
