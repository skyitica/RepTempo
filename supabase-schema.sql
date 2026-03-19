-- Run this in your Supabase project: SQL Editor → New Query → Run

-- Saved workout templates
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  exercises jsonb not null,
  created_at timestamptz default now()
);

-- Completed workout sessions
create table workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_name text not null,
  exercises jsonb not null,
  duration_seconds integer,
  completed_at timestamptz default now()
);

-- Row Level Security (users can only see/edit their own data)
alter table workouts enable row level security;
alter table workout_logs enable row level security;

create policy "Users own their workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users own their workout logs"
  on workout_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
