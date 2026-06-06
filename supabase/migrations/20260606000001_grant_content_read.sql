-- Grant read access on public content tables to the browser roles.
--
-- The frontend reads content with the anon key (and, once auth lands, the
-- authenticated role). Without an explicit SELECT grant these queries fail with
-- "permission denied for table ...". Row Level Security still applies where it
-- is enabled: mnemonics stays filtered to public rows by its existing policy,
-- and the per-user tables (users, cards, review_logs) are deliberately NOT
-- granted here, so they remain owner-locked.

GRANT SELECT ON TABLE
  public.topics,
  public.words,
  public.sentences,
  public.mnemonics,
  public.audio,
  public.language_islands,
  public.island_sentences
TO anon, authenticated;
