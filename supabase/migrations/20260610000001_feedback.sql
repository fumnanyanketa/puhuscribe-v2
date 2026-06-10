-- Live beta feedback. Testers submit from the in-app "Palaute / Feedback"
-- button; the owner reads submissions in the Supabase dashboard. Idempotent.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  message     text not null,
  rating      smallint,          -- 1 = needs work, 2 = okay, 3 = love it
  screen      text,              -- which tab they were on
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Anyone using the app may leave feedback; nobody can read it back (no SELECT
-- policy), so submissions are private to the owner (dashboard / service role).
grant insert on public.feedback to authenticated, anon;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback' and policyname = 'feedback_insert'
  ) then
    create policy feedback_insert on public.feedback
      for insert to authenticated, anon
      with check (true);
  end if;
end $$;
