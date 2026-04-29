-- 给 admin_payment_settings 增加设备 ID / 操作员 / 回调公钥 字段
alter table public.admin_payment_settings
  add column if not exists device_id text default '',
  add column if not exists operator text default '',
  add column if not exists callback_public_key text default '';

-- 把当前已有行的 NULL 值刷成空串（避免历史数据 NULL）
update public.admin_payment_settings
set
  device_id = coalesce(device_id, ''),
  operator = coalesce(operator, ''),
  callback_public_key = coalesce(callback_public_key, '')
where id = 1;
