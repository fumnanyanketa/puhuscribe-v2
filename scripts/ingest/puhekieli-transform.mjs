// scripts/ingest/puhekieli-transform.mjs
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  THIS PRODUCES A DRAFT FOR A FINNISH SPEAKER TO VERIFY — NOT SHIPPING DATA │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Puhekieli (spoken Finnish) is the product's wedge, and there is NO Creative
// Commons parallel kirjakieli↔puhekieli corpus to ingest (see README §"The
// honest gap"). So we apply a deliberately CONSERVATIVE, high-confidence,
// whole-word rule set to real Tatoeba kirjakieli, and hand the result to a
// human. Spoken Finnish is regionally variable and morphophonologically messy;
// this transform only covers cases that are near-universal in everyday
// (Helsinki-region/yleispuhekieli) speech. Everything it touches is flagged for
// review. NEVER write this output straight into the sentences table.

/**
 * Whole-word substitutions. Keys are lowercased kirjakieli forms; values are
 * the colloquial forms. Only forms that are standard across yleispuhekieli are
 * included.
 * @type {Record<string, string>}
 */
export const WORD_SUBSTITUTIONS = {
  // personal pronouns
  minä: 'mä', minua: 'mua', minun: 'mun', minulla: 'mulla', minulle: 'mulle', minut: 'mut',
  sinä: 'sä', sinua: 'sua', sinun: 'sun', sinulla: 'sulla', sinulle: 'sulle', sinut: 'sut',
  hän: 'se', häntä: 'sitä', hänen: 'sen', hänellä: 'sillä', hänelle: 'sille',
  he: 'ne', heitä: 'niitä', heidän: 'niiden', heillä: 'niillä', heille: 'niille',
  // demonstratives
  tämä: 'tää', tätä: 'tätä', nämä: 'nää', tuo: 'toi', nuo: 'noi',
  // copula (olla)
  olen: 'oon', olet: 'oot', olette: 'ootte', ovat: 'on',
  // common reductions
  ole: 'oo', // as in "en ole" -> "en oo"
}

/**
 * Suffix rewrites applied when no whole-word substitution matched. Each is a
 * [regex, replacement] on the lowercased word core. Conservative: past
 * participle final-t drop, which is near-universal in speech.
 * @type {Array<[RegExp, string]>}
 */
export const SUFFIX_RULES = [
  [/nut$/, 'nu'], // asunut -> asunu
  [/nyt$/, 'ny'], // tehnyt -> tehny  (NB: the standalone adverb "nyt"=now is excluded below)
]

// Words that look like a suffix rule target but must be left alone.
const SUFFIX_EXCEPTIONS = new Set(['nyt', 'kaupunut' /* not a word; placeholder guard */])

/** Restore the leading-capital pattern of `original` onto `replacement`. */
function matchCase(original, replacement) {
  if (original.length === 0) return replacement
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }
  return replacement
}

/**
 * Transform a single whitespace-delimited token, preserving leading/trailing
 * punctuation and capitalisation. Returns the new token and whether it changed.
 * @param {string} token
 * @returns {{ token: string, changed: boolean }}
 */
export function transformToken(token) {
  const m = token.match(/^([^\p{L}]*)(\p{L}[\p{L}-]*)?([^\p{L}]*)$/u)
  if (!m || !m[2]) return { token, changed: false }
  const [, lead, core, trail] = m
  const lower = core.toLowerCase()

  let next = WORD_SUBSTITUTIONS[lower]
  if (next === undefined && !SUFFIX_EXCEPTIONS.has(lower)) {
    for (const [re, rep] of SUFFIX_RULES) {
      if (re.test(lower)) {
        next = lower.replace(re, rep)
        break
      }
    }
  }

  if (next === undefined || next === lower) return { token, changed: false }
  return { token: lead + matchCase(core, next) + trail, changed: true }
}

/**
 * Apply the conservative transform to a whole kirjakieli sentence.
 * @param {string} kirja
 * @returns {{ puhe: string, changed: boolean }}
 */
export function transformSentence(kirja) {
  const tokens = kirja.split(/(\s+)/) // keep the whitespace tokens
  let changed = false
  const out = tokens.map((t) => {
    if (/^\s+$/.test(t)) return t
    const r = transformToken(t)
    if (r.changed) changed = true
    return r.token
  })
  return { puhe: out.join(''), changed }
}
