-- PuhuScribe — Language Islands starter pack: useful real-life SENTENCES for a
-- newcomer in Finland (no bare single words — those live in the Day One sprint).
-- Kirjakieli is Voikko word-validated; puhekieli (spoken) still needs a
-- Finnish-speaker verification pass (see docs/island-sentences.md).
-- Idempotent: re-running replaces the 'arki' set. Run once in the Supabase SQL editor.

INSERT INTO topics (slug, name_fi, name_en, yki_category, sort_order)
VALUES ('arki', 'Arki', 'Everyday essentials', 'daily_life', 5)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM sentences WHERE topic_id = (SELECT id FROM topics WHERE slug = 'arki');

INSERT INTO sentences (kirjakieli, puhekieli, translation_en, level, topic_id) VALUES
  ('Hyvää huomenta.', 'Huomenta.', 'Good morning.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Kiitos paljon.', 'Kiitos paljon.', 'Thank you very much.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Ole hyvä.', 'Ole hyvä.', 'You''re welcome.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Mukavaa päivänjatkoa!', 'Mukavaa päivänjatkoa!', 'Have a nice day!', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Minun nimeni on Maria.', 'Mun nimi on Maria.', 'My name is Maria.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Hauska tutustua.', 'Hauska tutustua.', 'Nice to meet you.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Olen kotoisin Nigeriasta.', 'Oon kotoisin Nigeriasta.', 'I am from Nigeria.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('En puhu vielä hyvin suomea.', 'En puhu viel hyvin suomee.', 'I don''t speak Finnish well yet.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Opiskelen suomea.', 'Mä opiskelen suomee.', 'I am learning Finnish.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Voitko puhua hitaammin?', 'Voitsä puhua hitaammin?', 'Can you speak more slowly?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Voitko toistaa?', 'Voitsä toistaa?', 'Can you repeat that?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('En ymmärrä.', 'En ymmärrä.', 'I don''t understand.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Puhutko englantia?', 'Puhutsä englantii?', 'Do you speak English?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Mitä tämä tarkoittaa?', 'Mitä tää tarkoittaa?', 'What does this mean?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Paljonko tämä maksaa?', 'Paljonks tää maksaa?', 'How much does this cost?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Saisinko kahvin?', 'Saisinks mä kahvin?', 'Could I have a coffee?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Voinko maksaa kortilla?', 'Voinks mä maksaa kortilla?', 'Can I pay by card?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Missä on vessa?', 'Mis on vessa?', 'Where is the toilet?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Katselen vain, kiitos.', 'Mä vaan katselen, kiitos.', 'I''m just looking, thanks.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Saisinko pussin?', 'Saisinks mä pussin?', 'Could I have a bag?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Onko tämä tarjouksessa?', 'Onks tää tarjouksessa?', 'Is this on offer?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Anteeksi, missä on bussipysäkki?', 'Anteeks, mis on bussipysäkki?', 'Excuse me, where is the bus stop?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Miten pääsen keskustaan?', 'Miten mä pääsen keskustaan?', 'How do I get to the centre?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Meneekö tämä bussi asemalle?', 'Meneeks tää bussi asemalle?', 'Does this bus go to the station?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Mistä voin ostaa lipun?', 'Mist mä voin ostaa lipun?', 'Where can I buy a ticket?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Onko se kaukana täältä?', 'Onks se kaukana täältä?', 'Is it far from here?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Tarvitsen lääkäriä.', 'Mä tarvin lääkäriä.', 'I need a doctor.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Olen sairas.', 'Mä oon kipeä.', 'I am sick.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Minulla on päänsärky.', 'Mul on päänsärky.', 'I have a headache.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Missä on lähin apteekki?', 'Mis on lähin apteekki?', 'Where is the nearest pharmacy?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Minulla on aika kello kaksi.', 'Mul on aika kahdelta.', 'I have an appointment at two.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Tähän sattuu.', 'Tähän sattuu.', 'It hurts here.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Minulla on aika Kelassa.', 'Mul on aika Kelassa.', 'I have an appointment at Kela.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Tarvitsen apua tämän lomakkeen kanssa.', 'Mä tarvin apua tän lomakkeen kanssa.', 'I need help with this form.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Mistä saan henkilötunnuksen?', 'Mist mä saan henkilötunnuksen?', 'Where do I get a personal identity code?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Haluaisin varata ajan.', 'Mä haluaisin varata ajan.', 'I would like to book an appointment.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Voisitko auttaa minua?', 'Voisitsä auttaa mua?', 'Could you help me?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Etsin asuntoa.', 'Mä etsin asuntoo.', 'I am looking for an apartment.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Paljonko vuokra on?', 'Paljonks vuokra on?', 'How much is the rent?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Etsin töitä.', 'Mä etsin töitä.', 'I am looking for a job.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Tässä on puhelinnumeroni.', 'Tässä on mun numero.', 'Here is my phone number.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Paljonko kello on?', 'Paljonks kello on?', 'What time is it?', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Voitko auttaa, olen eksyksissä.', 'Voitsä auttaa, mä oon eksyksissä.', 'Can you help me, I am lost.', 'A1', (SELECT id FROM topics WHERE slug = 'arki')),
  ('Hetki, kiitos.', 'Hetki, kiitos.', 'One moment, please.', 'A1', (SELECT id FROM topics WHERE slug = 'arki'));
