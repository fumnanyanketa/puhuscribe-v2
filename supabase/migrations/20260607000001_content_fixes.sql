-- Content corrections — 2026-06-07
-- Run once in Supabase SQL editor.
-- Covers §1 base_form typos, §2 missing words, §3 translation errors,
-- §4 pronunciation fixes in mnemonics.

-- ============================================================
-- §1  Base-form spelling corrections
-- ============================================================

UPDATE words SET base_form = 'hedelmä'      WHERE base_form = 'hedelma';
UPDATE words SET base_form = 'hyvä'         WHERE base_form = 'hyva';
UPDATE words SET base_form = 'tummansininen' WHERE base_form = 'tummansiniinen';

-- ============================================================
-- §3  Translation corrections
-- ============================================================

-- terve: primary meaning is the greeting, not "healthy"
UPDATE words SET translation_en = 'hello'   WHERE base_form = 'terve';

-- minä: no formal/informal split on Finnish first person
UPDATE words SET translation_en = 'I / me'  WHERE base_form = 'minä';

-- voida: canonical gloss (the "feel" sense lives in usage, not the base gloss)
UPDATE words SET translation_en = 'to be able to / can'  WHERE base_form = 'voida';

-- ============================================================
-- §2  Missing high-frequency words
-- ============================================================

INSERT INTO words (base_form, translation_en, frequency_rank, level, part_of_speech, topic_id) VALUES
  ('kyllä',    'yes',        4,   'A1', 'particle', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('tämä',     'this',       7,   'A1', 'pronoun',  (SELECT id FROM topics WHERE slug = 'greetings')),
  ('tuo',      'that',       9,   'A1', 'pronoun',  (SELECT id FROM topics WHERE slug = 'greetings')),
  ('se',       'it',         14,  'A1', 'pronoun',  (SELECT id FROM topics WHERE slug = 'greetings')),
  ('ehkä',     'maybe',      80,  'A1', 'particle', (SELECT id FROM topics WHERE slug = 'greetings')),
  ('tässä',    'here',       95,  'A1', 'adverb',   (SELECT id FROM topics WHERE slug = 'greetings')),
  ('siellä',   'there',      100, 'A1', 'adverb',   (SELECT id FROM topics WHERE slug = 'greetings')),
  ('sitten',   'then',       90,  'A1', 'adverb',   (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('kotona',   'at home',    45,  'A1', 'adverb',   (SELECT id FROM topics WHERE slug = 'home')),
  ('herätä',   'to wake up', 200, 'A1', 'verb',     (SELECT id FROM topics WHERE slug = 'daily_routines')),
  ('rakastaa', 'to love',    150, 'A1', 'verb',     (SELECT id FROM topics WHERE slug = 'family'))
ON CONFLICT (base_form) DO NOTHING;

-- ============================================================
-- §4  Mnemonic pronunciation corrections (UPDATE existing rows)
-- Finnish phonology rules applied:
--   y  = /y/  → 'ew' as in few (ROUNDED, not 'ee' or 'ih')
--   ö  = /ø/  → 'ur' as in fur (no r sound, ROUNDED)
--   ä  = /æ/  → 'a' as in cat (NOT 'ah'/'ay'/'ur')
--   au = /ɑu/ → 'ow' as in cow (NOT English 'aw')
--   ai = /ɑi/ → 'eye' / 'igh' (NOT 'ay')
--   j  = /j/  → English 'y' (NOT English 'j')
--   uo, ie, yö etc. = both vowels glided
--   Stress: ALWAYS first syllable
-- ============================================================

-- ole hyvä (y = 'ew')
UPDATE mnemonics SET text = 'O-le HY-vä — ''OH-leh HEW-va'': rounded lips on ''hew'', not ''hee''. YOU''RE WELCOME.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'ole hyvä') AND user_id IS NULL;

-- työ (yö = 'ew' gliding to 'ur')
UPDATE mnemonics SET text = 'TYÖ — round your lips for ''ew'' and glide to ''ur'': one tight syllable. WORK.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'työ') AND user_id IS NULL;

-- yö (yö = 'ew-ur')
UPDATE mnemonics SET text = 'YÖ — ''ew'' gliding into ''ur'', lips rounded throughout. NIGHT.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'yö') AND user_id IS NULL;

-- ystävä (y = 'ew', not 'east')
UPDATE mnemonics SET text = 'YS-tä-vä — ''HEWS-ta-va'': rounded ''ew'', ''ta'' as in cat. Your FRIEND.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'ystävä') AND user_id IS NULL;

-- tyttö (y = 'ew', ö = 'ur')
UPDATE mnemonics SET text = 'TYT-tö — ''TEWT-tur'': rounded lips on both vowels. A GIRL.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'tyttö') AND user_id IS NULL;

-- kylmä (y = 'ew')
UPDATE mnemonics SET text = 'KYL-mä — ''KEWL-ma'': rounded ''ew'', ''ma'' as in cat. COLD.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kylmä') AND user_id IS NULL;

-- lyhyt (BOTH y = 'ew')
UPDATE mnemonics SET text = 'LY-hyt — ''LEW-hewt'': BOTH vowels get the rounded ''ew''. SHORT.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'lyhyt') AND user_id IS NULL;

-- väsynyt (ä = 'a' cat, y = 'ew')
UPDATE mnemonics SET text = 'VÄ-sy-nyt — ''VA-sew-newt'': ''va'' as in cat, then rounded ''ew'' twice. TIRED.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'väsynyt') AND user_id IS NULL;

-- täytyä (äy = 'a-ew', ä = 'a' cat)
UPDATE mnemonics SET text = 'TÄY-ty-ä — ''ta'' (cat) gliding to ''ew'', then ''tew-a''. MUST.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'täytyä') AND user_id IS NULL;

-- kysyä (y = 'ew', not 'kee')
UPDATE mnemonics SET text = 'KY-sy-ä — ''KEW-sew-a'': rounded ''ew'', not ''kee''. TO ASK.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kysyä') AND user_id IS NULL;

-- syödä (syö = 'sew-ur')
UPDATE mnemonics SET text = 'SYÖ-dä — ''sew'' gliding to ''ur'', then ''da''. TO EAT.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'syödä') AND user_id IS NULL;

-- yksi (y = 'ew')
UPDATE mnemonics SET text = 'YK-si — ''EWK-see'': rounded ''ew''. ONE.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'yksi') AND user_id IS NULL;

-- yhdeksän (y = 'ew', ä = 'a' cat)
UPDATE mnemonics SET text = 'YH-dek-sän — ''EWH-dek-san'': rounded ''ew'', ''san'' as in cat. NINE.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'yhdeksän') AND user_id IS NULL;

-- kymmenen (y = 'ew')
UPDATE mnemonics SET text = 'KYM-me-nen — ''KEWM-me-nen'': rounded ''ew''. TEN.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kymmenen') AND user_id IS NULL;

-- nyt (y = 'ew', like NEWT)
UPDATE mnemonics SET text = 'NYT — like the amphibian ''NEWT'', rounded ''ew''. NOW.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'nyt') AND user_id IS NULL;

-- lämpö (ä = 'a' cat, ö = 'ur')
UPDATE mnemonics SET text = 'LÄM-pö — ''LAM'' (as in cat) + ''pur'' (as in fur, no r). WARMTH.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'lämpö') AND user_id IS NULL;

-- löytää (ö = 'ur', ää = long 'aa')
UPDATE mnemonics SET text = 'LÖY-tää — ''LUR'' gliding to ''ee'', then long ''aa'' (like baa). TO FIND.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'löytää') AND user_id IS NULL;

-- lääkäri (ää = long 'aa' like baa)
UPDATE mnemonics SET text = 'LÄÄ-kä-ri — long ''AA'' as in a sheep''s ''baa'', then ''ka-ri''. DOCTOR.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'lääkäri') AND user_id IS NULL;

-- sää (ää = long 'aa' like baa)
UPDATE mnemonics SET text = 'SÄÄ — long ''AA'' like a sheep''s ''baa''. WEATHER.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'sää') AND user_id IS NULL;

-- tärkeä (ä = 'a' cat, not 'ur')
UPDATE mnemonics SET text = 'TÄR-ke-ä — ''TAR'' (a as in cat) + ''keh-a''. IMPORTANT.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'tärkeä') AND user_id IS NULL;

-- auto (au = 'ow' as in cow, not English 'aw')
UPDATE mnemonics SET text = 'AU-to — ''OW'' as in cow, plus ''toh'': say ''OW-toh''. Not English ''aw-to''. A CAR.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'auto') AND user_id IS NULL;

-- aurinko (au = 'ow')
UPDATE mnemonics SET text = 'AU-rin-ko — ''OW-rin-koh'': ''ow'' as in cow. THE SUN.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'aurinko') AND user_id IS NULL;

-- aika (ai = 'eye')
UPDATE mnemonics SET text = 'AI-ka — ''EYE-ka'': ''ai'' sounds like ''eye''. TIME.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'aika') AND user_id IS NULL;

-- äiti (ä = 'a' cat, äi = 'eye')
UPDATE mnemonics SET text = 'ÄI-ti — ''a'' (cat) gliding to ''ee'', making ''EYE-tee''. MOTHER.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'äiti') AND user_id IS NULL;

-- juna (j = English 'y')
UPDATE mnemonics SET text = 'JU-na — ''j'' is English ''y''! Say ''YOO-na''. A TRAIN.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'juna') AND user_id IS NULL;

-- kirjasto (j = English 'y')
UPDATE mnemonics SET text = 'KIR-jas-to — ''KEER-yas-toh'': ''j'' = ''y'', rolled r. LIBRARY.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kirjasto') AND user_id IS NULL;

-- suljettu (j = English 'y')
UPDATE mnemonics SET text = 'SUL-jet-tu — ''SOOL-yet-too'': ''j'' = ''y''. CLOSED.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'suljettu') AND user_id IS NULL;

-- koulu (ou = 'oh-oo' glide)
UPDATE mnemonics SET text = 'KOU-lu — ''KOH'' gliding to ''oo'': say ''KOH-oo-loo''. SCHOOL.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'koulu') AND user_id IS NULL;

-- puisto (puis = 'poo-ees', not 'boost')
UPDATE mnemonics SET text = 'PUIS-to — ''POO-ees-toh'': ''p'' not ''b''. A PARK.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'puisto') AND user_id IS NULL;

-- nuori (uo = 'noo-oh' glide)
UPDATE mnemonics SET text = 'NUO-ri — ''NOO-oh-ree''. YOUNG.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'nuori') AND user_id IS NULL;

-- kauppa (au = 'ow' as in cow, not 'cop')
UPDATE mnemonics SET text = 'KAU-pa — ''KOWP-pa'': ''au'' = ''ow'' as in cow. SHOP.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kauppa') AND user_id IS NULL;

-- järvi (j = English 'y', ä = 'a' cat)
UPDATE mnemonics SET text = 'JÄR-vi — ''YAR-vee'': ''j'' = English ''y'', ''ä'' as in cat. LAKE.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'järvi') AND user_id IS NULL;

-- päivä (äi = 'pie', ä = 'a' cat)
UPDATE mnemonics SET text = 'PÄI-vä — ''PIE-va'': ''äi'' = ''pie'' (eye), ''va'' as in cat. DAY.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'päivä') AND user_id IS NULL;

-- metsä (ä = 'a' cat, not 'ah')
UPDATE mnemonics SET text = 'MET-sä — ''MET-sa'': ''a'' as in cat. FOREST.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'metsä') AND user_id IS NULL;

-- mennä (ä = 'a' cat, not 'ah')
UPDATE mnemonics SET text = 'MEN-nä — ''MEN-na'': ''na'' as in cat. TO GO.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'mennä') AND user_id IS NULL;

-- nähdä (ä = 'a' cat, not 'ah')
UPDATE mnemonics SET text = 'NÄH-dä — ''NA-da'': ''a'' as in cat. TO SEE.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'nähdä') AND user_id IS NULL;

-- tehdä (ä = 'a' cat)
UPDATE mnemonics SET text = 'TEH-dä — ''TEH-da'': ''da'' as in cat. TO DO or not to do.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'tehdä') AND user_id IS NULL;

-- tietää (ie = 'ee-eh', ää = long 'aa' like baa)
UPDATE mnemonics SET text = 'TIE-tää — ''TYEH-taa'': ''ie'' glides ee-eh, long ''aa'' like baa. TO KNOW.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'tietää') AND user_id IS NULL;

-- kävellä (ä = 'a' cat throughout)
UPDATE mnemonics SET text = 'KÄ-vel-lä — ''KA-vel-la'': ''a'' as in cat throughout. TO WALK.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'kävellä') AND user_id IS NULL;

-- lähteä (ä = 'a' cat)
UPDATE mnemonics SET text = 'LÄH-te-ä — ''LA-te-a'': ''a'' as in cat, like a latte to go. TO LEAVE.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'lähteä') AND user_id IS NULL;

-- missä (ä = 'a' cat)
UPDATE mnemonics SET text = 'MIS-sä — ''MIS-sa'': ''a'' as in cat. WHERE?'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'missä') AND user_id IS NULL;

-- neljä (j = 'y', ä = 'a' cat)
UPDATE mnemonics SET text = 'NEL-jä — ''NEL-ya'': ''j'' = ''y'', ''a'' as in cat. FOUR.'
WHERE word_id = (SELECT id FROM words WHERE base_form = 'neljä') AND user_id IS NULL;

-- ============================================================
-- §2 + §1  Insert mnemonics for words that previously had none
-- (hyvä typo now fixed; 11 missing words now inserted above)
-- Uses NOT EXISTS to stay idempotent on reruns.
-- ============================================================

INSERT INTO mnemonics (word_id, text, is_public)
SELECT w.id, m.text, true
FROM (VALUES
  ('hyvä',     'HY-vä — ''HEW-va'': round your lips for ''ew'' (like few), ''va'' as in cat. GOOD.'),
  ('kyllä',    'KYL-lä — ''KEWL-la'': rounded ''ew'', ''la'' as in cat. YES.'),
  ('tämä',     'TÄ-mä — ''TAM-ma'': ''a'' as in cat, both syllables. THIS one right here.'),
  ('tuo',      'TUO — ''TOO-oh'': ''uo'' glides from ''oo'' to ''oh''. THAT one over there.'),
  ('se',       'SE — ''SEH'': IT. Short and simple.'),
  ('ehkä',     'EH-kä — ''EH-ka'': ''a'' as in cat. MAYBE.'),
  ('sitten',   'SIT-ten — sit down, THEN relax. THEN.'),
  ('tässä',    'TÄS-sä — ''TAS-sa'': ''a'' as in cat, both times. HERE.'),
  ('siellä',   'SIEL-lä — ''SYEL-la'': ''ie'' glides ee-eh, ''la'' as in cat. THERE.'),
  ('kotona',   'KO-to-na — ''KOH-toh-nah'': a cozy tonal feeling. AT HOME.'),
  ('herätä',   'HE-rä-tä — ''HEH-ra-ta'': ''rä'' and ''tä'' both ''a'' as in cat. TO WAKE UP.'),
  ('rakastaa', 'RA-kas-taa — ''RAH-kas-taa'': ''a'' as in father, long ''aa'' at the end. TO LOVE.')
) AS m(base_form, text)
JOIN words w ON w.base_form = m.base_form
WHERE NOT EXISTS (
  SELECT 1 FROM mnemonics x WHERE x.word_id = w.id AND x.user_id IS NULL
);
