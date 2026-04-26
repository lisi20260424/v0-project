-- 创建供应商配置表

create table if not exists public.admin_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_admin_providers_enabled on public.admin_providers (enabled);
create index if not exists idx_admin_providers_name on public.admin_providers (name);

-- updated_at 自动维护
drop trigger if exists trg_admin_providers_touch on public.admin_providers;
create trigger trg_admin_providers_touch
before update on public.admin_providers
for each row execute function public.touch_updated_at();

-- RLS：已启用的供应商对所有登录用户可见
alter table public.admin_providers enable row level security;

drop policy if exists admin_providers_select_enabled on public.admin_providers;
create policy admin_providers_select_enabled on public.admin_providers
  for select to authenticated using (enabled = true);

-- 插入初始供应商
insert into public.admin_providers (name, display_name, description, enabled)
values
  ('openai', 'OpenAI', 'OpenAI AI 模型提供商', true),
  ('anthropic', 'Anthropic', 'Anthropic Claude 模型提供商', true),
  ('google', 'Google', 'Google Gemini 模型提供商', true),
  ('groq', 'Groq', 'Groq 高速推理模型提供商', true),
  ('xai', 'xAI', 'xAI Grok 模型提供商', true),
  ('deepinfra', 'DeepInfra', 'DeepInfra 开源模型提供商', true),
  ('custom', '自定义', '自定义模型提供商', true)
on conflict (name) do nothing;
