-- scripts/004_rename_preference_columns.sql
-- 把 user_preferences 的列名对齐到应用端使用的命名
-- 幂等：每条 rename 前都检查旧列是否存在

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_preferences' and column_name = 'default_aspect_ratio'
  ) then
    alter table public.user_preferences rename column default_aspect_ratio to default_ratio;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_preferences' and column_name = 'email_notifications'
  ) then
    alter table public.user_preferences rename column email_notifications to notify_email;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_preferences' and column_name = 'inbox_notifications'
  ) then
    alter table public.user_preferences rename column inbox_notifications to notify_inbox;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_preferences' and column_name = 'sms_notifications'
  ) then
    alter table public.user_preferences rename column sms_notifications to notify_sms;
  end if;
end $$;
