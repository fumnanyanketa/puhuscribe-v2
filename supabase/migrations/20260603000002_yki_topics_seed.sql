-- YKI-aligned topic seed data (25 topics)
-- Covers the five YKI test domains: daily life, social participation, work/study,
-- public services, and civic/cultural contexts.

INSERT INTO topics (slug, name_fi, name_en, yki_category, sort_order) VALUES
  -- Daily Life (arkielämä)
  ('greetings',         'Tervehtiminen ja esittäytyminen', 'Greetings & introductions',   'daily_life', 10),
  ('family',            'Perhe ja ihmissuhteet',           'Family & relationships',       'daily_life', 20),
  ('home',              'Koti ja asuminen',                'Home & housing',               'daily_life', 30),
  ('food_drink',        'Ruoka ja juoma',                  'Food & drink',                 'daily_life', 40),
  ('shopping',          'Ostokset ja kauppa',              'Shopping',                     'daily_life', 50),
  ('daily_routines',    'Arkirutiinit ja vapaa-aika',      'Daily routines & free time',   'daily_life', 60),

  -- Social Participation (osallistuminen)
  ('health',            'Terveys ja sairaanhoito',         'Health & healthcare',          'social',     110),
  ('transport',         'Liikenne ja matkustaminen',       'Transport & travel',           'social',     120),
  ('weather',           'Sää ja vuodenajat',               'Weather & seasons',            'social',     130),
  ('hobbies',           'Harrastukset ja urheilu',         'Hobbies & sports',             'social',     140),
  ('events',            'Tapahtumat ja juhlat',            'Events & celebrations',        'social',     150),

  -- Work & Study (työ ja opiskelu)
  ('work_general',      'Työ ja ammatti',                  'Work & profession',            'work_study', 210),
  ('workplace',         'Työpaikka ja työkaverit',         'Workplace & colleagues',       'work_study', 220),
  ('job_search',        'Työnhaku ja CV',                  'Job seeking & CV',             'work_study', 230),
  ('education',         'Opiskelu ja koulutus',            'Education & study',            'work_study', 240),
  ('technology',        'Teknologia ja digitaalinen arki', 'Technology & digital life',    'work_study', 250),

  -- Public Services (julkiset palvelut)
  ('banking',           'Pankki ja raha-asiat',            'Banking & money',              'public',     310),
  ('post_office',       'Posti ja paketit',                'Post & parcels',               'public',     320),
  ('housing_services',  'Asumispalvelut ja viranomaiset',  'Housing services & officials', 'public',     330),
  ('emergency',         'Hätätilanteet ja turvallisuus',   'Emergencies & safety',         'public',     340),

  -- Civic & Cultural (yhteiskunta ja kulttuuri)
  ('city_life',         'Kaupunki ja ympäristö',           'City life & environment',      'civic',      410),
  ('media_news',        'Media ja uutiset',                'Media & news',                 'civic',      420),
  ('integration',       'Kotoutuminen ja kulttuuri',       'Integration & culture',        'civic',      430),
  ('rights_duties',     'Oikeudet ja velvollisuudet',      'Rights & duties',              'civic',      440),
  ('yki_exam_prep',     'YKI-kokeeseen valmistautuminen',  'YKI exam preparation',         'civic',      450);
