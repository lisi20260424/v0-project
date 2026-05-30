-- scripts/003_extend_profiles_and_preferences.sql
-- 补齐应用端实际使用的字段，幂等，可重复执行

-- profiles: 个人主页附加字段 + 会员/点数字段
alter table public.profiles
  add column if not exists website text,
  add column if not exists points integer not null default 0,
  add column if not exists vip_tier text;

-- vip_tier 取值约束：monthly / annual / lifetime / null
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_vip_tier_check'
  ) then
    alter table public.profiles
      add constraint profiles_vip_tier_check
      check (vip_tier is null or vip_tier in ('monthly','annual','lifetime'));
  end if;
end $$;

-- user_preferences: 默认图像模型 / 主题 / 短信通知
alter table public.user_preferences
  add column if not exists default_image_model text not null default 'nano-banana',
  add column if not exists theme text not null default 'dark',
  add column if not exists sms_notifications boolean not null default false;

-- theme 取值约束：light / dark / system
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_preferences_theme_check'
  ) then
    alter table public.user_preferences
      add constraint user_preferences_theme_check
      check (theme in ('light','dark','system'));
  end if;
end $$;
