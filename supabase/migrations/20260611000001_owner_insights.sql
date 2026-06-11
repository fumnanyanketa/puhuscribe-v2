-- Owner insights: one SECURITY DEFINER function the OWNER's signed-in account
-- can call from the app to see the beta cohort (testers, activity, feedback).
--
-- Why a function: every per-user table is RLS-locked to its own user, so the
-- owner's client cannot read other testers' rows directly — and we never ship
-- a service-role key to the browser. SECURITY DEFINER runs as the migration
-- owner (bypasses RLS) but the function REFUSES any caller whose JWT email is
-- not in the owner list below. Idempotent; run once in the Supabase SQL editor.
--
-- IMPORTANT: if you sign into the APP with a different email, edit the list in
-- owner_emails() below and re-run this file.

create or replace function public.owner_emails()
returns text[]
language sql
immutable
as $$
  select array['aiprotocolslab@gmail.com']
$$;

create or replace function public.owner_insights()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  result jsonb;
begin
  if not (caller_email = any (public.owner_emails())) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'totals', jsonb_build_object(
      'testers',  (select count(*) from users),
      'active1',  (select count(distinct user_id) from review_logs where review_time >= now() - interval '1 day'),
      'active7',  (select count(distinct user_id) from review_logs where review_time >= now() - interval '7 days'),
      'reviews7', (select count(*) from review_logs where review_time >= now() - interval '7 days'),
      'feedback', (select count(*) from feedback)
    ),
    'testers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email',      u.email,
        'joined',     u.created_at,
        'words',      coalesce(w.n, 0),
        'sentences',  coalesce(s.n, 0),
        'reviews7',   coalesce(r7.n, 0),
        'lastActive', la.t
      ) order by la.t desc nulls last)
      from users u
      left join lateral (
        select count(*) n from cards c
        where c.user_id = u.id and c.card_type = 'word_production'
      ) w on true
      left join lateral (
        select count(*) n from user_island_sentences uis where uis.user_id = u.id
      ) s on true
      left join lateral (
        select count(*) n from review_logs rl
        where rl.user_id = u.id and rl.review_time >= now() - interval '7 days'
      ) r7 on true
      left join lateral (
        -- GREATEST ignores NULLs, so a brand-new signup still gets a timestamp
        -- from their first card even before any review.
        select greatest(
          (select max(rl.review_time) from review_logs rl where rl.user_id = u.id),
          (select max(c.created_at)   from cards c       where c.user_id = u.id)
        ) t
      ) la on true
    ), '[]'::jsonb),
    'feedback', coalesce((
      select jsonb_agg(jsonb_build_object(
        'message', f.message,
        'rating',  f.rating,
        'screen',  f.screen,
        'email',   u.email,
        'at',      f.created_at
      ) order by f.created_at desc)
      from (select * from feedback order by created_at desc limit 30) f
      left join users u on u.id = f.user_id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

-- Functions are executable by PUBLIC by default — lock that down. The email
-- check above is the real gate; this just avoids pointless anon calls.
revoke all on function public.owner_insights() from public, anon;
grant execute on function public.owner_insights() to authenticated;
