-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- It creates the games table and enables row-level security so each user
-- can only see and edit their own games.

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  location text,
  game_date date not null,
  home_score int,
  away_score int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Lineup data is stored as JSON on the game row.
-- Shape: { players: [{id,name}], lineups: {1..6: {pos: playerId}}, battingOrder: [playerId|null,...], currentInning: 1 }
alter table games add column if not exists lineup_data jsonb default '{}'::jsonb;

-- ============================================================
-- Team players (reusable roster)
-- ============================================================
create table if not exists team_players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  jersey_number text,
  created_at timestamptz default now()
);

-- Manual sort order on the /roster page (drag-and-drop reordering).
alter table team_players add column if not exists sort_order int default 0;

create index if not exists team_players_user_id_idx
  on team_players (user_id, sort_order, name);

alter table team_players enable row level security;

drop policy if exists "Users manage their own team players" on team_players;
create policy "Users manage their own team players"
  on team_players for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Subscriptions (Stripe)
-- ============================================================
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text, -- active, trialing, past_due, canceled, incomplete, etc.
  plan text,   -- 'monthly' | 'annual'
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on subscriptions;
create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Note: writes happen only from the server (with service-role) via the Stripe webhook,
-- so no insert/update/delete policies are needed for users.

create index if not exists games_user_id_game_date_idx
  on games (user_id, game_date desc);

alter table games enable row level security;

drop policy if exists "Users can view their own games" on games;
create policy "Users can view their own games"
  on games for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own games" on games;
create policy "Users can insert their own games"
  on games for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own games" on games;
create policy "Users can update their own games"
  on games for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own games" on games;
create policy "Users can delete their own games"
  on games for delete
  using (auth.uid() = user_id);
