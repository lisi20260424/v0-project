-- scripts/014_add_user_management_fields.sql
-- 为 profiles 增加"用户管理"所需字段：用户类型 / 用户状态 / VIP 到期时间
-- 幂等，可重复执行

-- 1) 新增字段
alter table public.profiles
  add column if not exists user_type text not null default 'normal',
  add column if not exists status text not null default 'active',
  add column if not exists vip_expires_at timestamptz;

-- 2) user_type 取值约束：normal / internal / enterprise / admin
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'profiles_user_type_check'
  ) then
    alter table public.profiles drop constraint profiles_user_type_check;
  end if;
  alter table public.profiles
    add constraint profiles_user_type_check
    check (user_type in ('normal','internal','enterprise','admin'));
end $$;

-- 3) status 取值约束：active / suspended / banned
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles drop constraint profiles_status_check;
  end if;
  alter table public.profiles
    add constraint profiles_status_check
    check (status in ('active','suspended','banned'));
end $$;

-- 4) 索引（按这些字段筛选时常用）
create index if not exists profiles_user_type_idx on public.profiles (user_type);
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_vip_tier_idx on public.profiles (vip_tier);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
