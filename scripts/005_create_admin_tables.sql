-- 管理员相关表：API 网关设置、模型配置、提示词配置

-- 1) API 网关设置（singleton：仅保留一行 id=1）
create table if not exists public.admin_gateway_settings (
  id smallint primary key default 1,
  api_key text,
  gateway_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint admin_gateway_settings_singleton check (id = 1)
);

insert into public.admin_gateway_settings (id, api_key, gateway_url)
values (1, '', '')
on conflict (id) do nothing;

-- 2) 模型配置
create table if not exists public.admin_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  -- 模型类型：video / image / music
  model_type text not null check (model_type in ('video', 'image', 'music')),
  -- 计费类型：per_use（按次计费）
  billing_type text not null default 'per_use' check (billing_type in ('per_use')),
  -- 单次消耗（积分数）
  cost_per_use integer not null default 0 check (cost_per_use >= 0),
  description text,
  -- 模型基础配置（按类型差异化）：分辨率、画质、时长等
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_admin_models_type on public.admin_models (model_type);
create index if not exists idx_admin_models_enabled on public.admin_models (enabled);

-- 3) 快捷提示词配置（按模型类型分组）
create table if not exists public.admin_prompts (
  id uuid primary key default gen_random_uuid(),
  -- 与 admin_models.model_type 对应
  model_type text not null check (model_type in ('video', 'image', 'music')),
  title text not null,
  content text not null,
  category text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_admin_prompts_type on public.admin_prompts (model_type);
create index if not exists idx_admin_prompts_enabled on public.admin_prompts (enabled);

-- updated_at 自动维护
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_gateway_touch on public.admin_gateway_settings;
create trigger trg_admin_gateway_touch
before update on public.admin_gateway_settings
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_models_touch on public.admin_models;
create trigger trg_admin_models_touch
before update on public.admin_models
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_prompts_touch on public.admin_prompts;
create trigger trg_admin_prompts_touch
before update on public.admin_prompts
for each row execute function public.touch_updated_at();

-- RLS：客户端只读公开内容；写操作仅服务端（service_role 绕过 RLS）
alter table public.admin_gateway_settings enable row level security;
alter table public.admin_models enable row level security;
alter table public.admin_prompts enable row level security;

-- gateway 设置不允许任何客户端读取（含敏感 api_key）
drop policy if exists admin_gateway_no_select on public.admin_gateway_settings;
create policy admin_gateway_no_select on public.admin_gateway_settings
  for select to authenticated using (false);

-- 已启用的模型对所有登录用户可见
drop policy if exists admin_models_select_enabled on public.admin_models;
create policy admin_models_select_enabled on public.admin_models
  for select to authenticated using (enabled = true);

-- 已启用的提示词对所有登录用户可见
drop policy if exists admin_prompts_select_enabled on public.admin_prompts;
create policy admin_prompts_select_enabled on public.admin_prompts
  for select to authenticated using (enabled = true);
