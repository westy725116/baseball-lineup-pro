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
-- Teams (a coach can have multiple teams; usually grouped by season)
-- ============================================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  season_year int,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists teams_user_id_idx
  on teams (user_id, sort_order, season_year desc, name);

alter table teams enable row level security;

drop policy if exists "Users manage their own teams" on teams;
create policy "Users manage their own teams"
  on teams for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Team players (reusable roster, scoped to a team)
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

-- Tie players to a specific team (nullable for legacy rows; auto-migrated on first visit).
alter table team_players add column if not exists team_id uuid references teams(id) on delete cascade;

create index if not exists team_players_team_id_idx
  on team_players (team_id, sort_order, name);

create index if not exists team_players_user_id_idx
  on team_players (user_id, sort_order, name);

alter table team_players enable row level security;

drop policy if exists "Users manage their own team players" on team_players;
create policy "Users manage their own team players"
  on team_players for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tie games to a specific team too (nullable for legacy rows; auto-migrated).
alter table games add column if not exists team_id uuid references teams(id) on delete set null;

create index if not exists games_team_id_idx on games (team_id, game_date desc);

-- Sharing: a public read-only link per game.
alter table games add column if not exists share_token text unique;
alter table games add column if not exists share_enabled boolean default false;

create index if not exists games_share_token_idx on games (share_token);

-- ============================================================
-- Comments left by share-link recipients (no auth required)
-- ============================================================
create table if not exists game_comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists game_comments_game_id_idx
  on game_comments (game_id, created_at desc);

alter table game_comments enable row level security;

-- The owner can read/delete their game's comments.
drop policy if exists "Owner reads game comments" on game_comments;
create policy "Owner reads game comments"
  on game_comments for select
  using (
    exists (
      select 1 from games g
      where g.id = game_comments.game_id and g.user_id = auth.uid()
    )
  );

drop policy if exists "Owner deletes game comments" on game_comments;
create policy "Owner deletes game comments"
  on game_comments for delete
  using (
    exists (
      select 1 from games g
      where g.id = game_comments.game_id and g.user_id = auth.uid()
    )
  );

-- Anonymous inserts are NOT allowed via RLS — share-link comments go
-- through a server action that uses the service-role key, gated by token.

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
