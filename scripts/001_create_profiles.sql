-- 用户资料表：与 auth.users 一一对应
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  -- 点数与会员
  points integer not null default 100,
  vip_tier text check (vip_tier in ('monthly','annual','lifetime')),
  vip_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- 用户偏好设置表
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_video_model text default 'veo3.1-fast',
  default_image_model text default 'nano-banana',
  default_ratio text default '9:16',
  language text default 'zh-CN',
  theme text default 'dark',
  notify_email boolean not null default true,
  notify_sms boolean not null default false,
  notify_inbox boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "prefs_select_own" on public.user_preferences;
drop policy if exists "prefs_insert_own" on public.user_preferences;
drop policy if exists "prefs_update_own" on public.user_preferences;
drop policy if exists "prefs_delete_own" on public.user_preferences;

create policy "prefs_select_own" on public.user_preferences
  for select using (auth.uid() = user_id);
create policy "prefs_insert_own" on public.user_preferences
  for insert with check (auth.uid() = user_id);
create policy "prefs_update_own" on public.user_preferences
  for update using (auth.uid() = user_id);
create policy "prefs_delete_own" on public.user_preferences
  for delete using (auth.uid() = user_id);
