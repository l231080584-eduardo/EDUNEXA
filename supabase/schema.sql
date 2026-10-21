-- Run once in Supabase SQL Editor to enable authenticated game-record sync.
create table if not exists public.game_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hero_class text not null default 'tech',
  final_score integer not null default 0 check (final_score >= 0),
  recommended_universities jsonb not null default '[]'::jsonb,
  record_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_records enable row level security;
grant select, insert, update on public.game_records to authenticated;
drop policy if exists "Players read their own game record" on public.game_records;
drop policy if exists "Players insert their own game record" on public.game_records;
drop policy if exists "Players update their own game record" on public.game_records;
create policy "Players read their own game record" on public.game_records for select to authenticated using (auth.uid() = user_id);
create policy "Players insert their own game record" on public.game_records for insert to authenticated with check (auth.uid() = user_id);
create policy "Players update their own game record" on public.game_records for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
