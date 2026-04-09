-- Table Stars - Database Schema
-- Run this in the Supabase SQL Editor

-- Children table
create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_emoji text not null default '😊',
  created_at timestamptz default now()
);

-- Stars table (one per child per day)
create table stars (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  date date not null default current_date,
  awarded_by text not null,
  created_at timestamptz default now(),
  unique (child_id, date)
);

-- Prizes table
create table prizes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  stars_redeemed int not null default 10,
  prize_name text,
  redeemed_at timestamptz default now()
);

-- RLS Policies
alter table children enable row level security;
alter table stars enable row level security;
alter table prizes enable row level security;

-- Everyone can read
create policy "Public read children" on children for select using (true);
create policy "Public read stars" on stars for select using (true);
create policy "Public read prizes" on prizes for select using (true);

-- Only allowed parents can write
create policy "Parents insert stars" on stars for insert
  with check (auth.jwt() ->> 'email' in ('elulrif@gmail.com', 'schwartzliron@gmail.com'));

create policy "Parents delete stars" on stars for delete
  using (auth.jwt() ->> 'email' in ('elulrif@gmail.com', 'schwartzliron@gmail.com'));

create policy "Parents insert prizes" on prizes for insert
  with check (auth.jwt() ->> 'email' in ('elulrif@gmail.com', 'schwartzliron@gmail.com'));

-- Seed data
insert into children (name, avatar_emoji) values
  ('Eitan', '🦁'),
  ('Tamar', '🦋');
