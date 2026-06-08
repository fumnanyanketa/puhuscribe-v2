-- Lets a learner reset their own progress (the "start over" / tester action):
-- delete their own cards. review_logs rows cascade away automatically
-- (review_logs.card_id REFERENCES cards(id) ON DELETE CASCADE). The existing
-- cards_own_rows RLS policy already restricts this to the user's own rows;
-- only the table GRANT was missing DELETE. Safe to re-run.
GRANT DELETE ON TABLE public.cards TO authenticated;
