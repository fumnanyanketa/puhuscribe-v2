-- Adds a first-language breakdown to the owner insights dashboard (demand
-- evidence for which UI languages to build next). The learner's language is
-- stored in users.progress->>'firstLanguage' (onboarding). CREATE OR REPLACE,
-- so this just updates the function from migration 20260611000001 in place;
-- run once in the Supabase SQL editor. Still owner-gated by owner_emails().

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
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object('language', lang, 'n', n) order by n desc, lang)
      from (
        select coalesce(nullif(trim(u.progress ->> 'firstLanguage'), ''), 'Not set') as lang, count(*) n
        from users u
        group by 1
      ) t
    ), '[]'::jsonb),
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

revoke all on function public.owner_insights() from public, anon;
grant execute on function public.owner_insights() to authenticated;
