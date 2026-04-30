-- ===============================================
-- 支付配置 + 订阅记录 + 账单记录 表结构
-- ===============================================

-- 1. 管理员支付配置（单行表，存储收钱吧凭证）
create table if not exists public.admin_payment_settings (
  id smallint primary key default 1,
  provider text not null default 'shouqianba',
  enabled boolean not null default false,
  vendor_sn text default '',
  vendor_key text default '',
  app_id text default '',
  terminal_sn text default '',
  terminal_key text default '',
  notify_url text default '',
  return_url text default '',
  gateway_url text default 'https://qr.shouqianba.com',
  test_mode boolean not null default true,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint admin_payment_settings_singleton check (id = 1)
);

-- 单行 seed
insert into public.admin_payment_settings (id) values (1) on conflict (id) do nothing;

alter table public.admin_payment_settings enable row level security;

-- 仅管理员可读写（普通用户完全不可访问），通过 service role 操作
drop policy if exists admin_payment_no_access on public.admin_payment_settings;
create policy admin_payment_no_access on public.admin_payment_settings
  for all to authenticated using (false) with check (false);


-- 2. 订阅记录（用户的会员/点数包订单 = 订阅记录）
create table if not exists public.subscription_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 套餐基础信息（冗余存储以保证历史数据稳定）
  plan_code text not null,
  plan_kind text not null check (plan_kind in ('membership', 'points')),
  plan_name text not null,
  -- 金额与权益
  amount numeric(10, 2) not null,
  original_amount numeric(10, 2),
  bonus_points integer not null default 0,
  -- 会员相关（仅 plan_kind = 'membership' 时使用）
  vip_tier text check (vip_tier in ('monthly', 'annual', 'lifetime')),
  vip_starts_at timestamptz,
  vip_expires_at timestamptz,
  -- 支付状态
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'expired', 'refunded', 'failed')),
  payment_method text check (payment_method in ('wechat', 'alipay')),
  payment_provider text default 'shouqianba',
  provider_order_sn text,
  provider_response jsonb,
  qr_code_content text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists subscription_orders_user_idx on public.subscription_orders(user_id, created_at desc);
create index if not exists subscription_orders_status_idx on public.subscription_orders(status);
create index if not exists subscription_orders_provider_sn_idx on public.subscription_orders(provider_order_sn);

alter table public.subscription_orders enable row level security;

drop policy if exists subscription_orders_select_own on public.subscription_orders;
create policy subscription_orders_select_own on public.subscription_orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists subscription_orders_insert_own on public.subscription_orders;
create policy subscription_orders_insert_own on public.subscription_orders
  for insert to authenticated with check (auth.uid() = user_id);

-- 更新由服务端 service role 完成


-- 3. 账单记录（用户所有的现金账单：充值/退款/赠送）
create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 类型
  type text not null check (type in ('recharge', 'refund', 'bonus', 'consumption')),
  direction text not null check (direction in ('in', 'out')),
  -- 金额（人民币元）和点数变化
  amount numeric(10, 2),
  points integer not null default 0,
  points_balance_after integer,
  -- 描述与关联
  description text not null,
  payment_method text,
  related_order_id uuid references public.subscription_orders(id) on delete set null,
  related_task_id uuid references public.generation_tasks(id) on delete set null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists billing_records_user_idx on public.billing_records(user_id, created_at desc);
create index if not exists billing_records_type_idx on public.billing_records(type);

alter table public.billing_records enable row level security;

drop policy if exists billing_records_select_own on public.billing_records;
create policy billing_records_select_own on public.billing_records
  for select to authenticated using (auth.uid() = user_id);


-- 4. 触发器：subscription_orders 变更时自动同步 updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscription_orders_touch_updated_at on public.subscription_orders;
create trigger subscription_orders_touch_updated_at
  before update on public.subscription_orders
  for each row execute function public.touch_updated_at();
