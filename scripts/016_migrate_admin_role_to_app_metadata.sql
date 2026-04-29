-- ============================================================
-- 016: 把管理员权限的判定从 ADMIN_EMAILS 白名单
--      迁移到 Supabase 的 auth.users.raw_app_meta_data.role
-- ------------------------------------------------------------
-- 约定：
--   raw_app_meta_data->>'role' = 'admin' → 管理员
--   该字段只能通过 service_role key 修改，普通用户无法篡改
--   且会自动写入 JWT，前后端均可读取
-- ============================================================

-- 1) 把已有的 profiles.user_type = 'admin' 同步到 auth.users.app_metadata
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
from public.profiles p
where p.id = u.id
  and p.user_type = 'admin';

-- 2) 把曾经被白名单（环境变量）授予的管理员邮箱手动加上
--    （如不再需要，请把下面这段删掉；如需保留，请把邮箱列表替换成你自己的）
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email in ('admin@example.com', 'owner@example.com');

-- 3) 同步反向：把 app_metadata.role = 'admin' 但 profiles.user_type 不是 admin 的也修正
update public.profiles p
set user_type = 'admin'
from auth.users u
where u.id = p.id
  and (u.raw_app_meta_data->>'role') = 'admin'
  and p.user_type <> 'admin';

-- 4) 校验：列出当前所有管理员账号
select u.email,
       p.user_type,
       u.raw_app_meta_data->>'role' as app_role,
       u.last_sign_in_at
from auth.users u
left join public.profiles p on p.id = u.id
where (u.raw_app_meta_data->>'role') = 'admin'
   or p.user_type = 'admin'
order by u.last_sign_in_at desc nulls last;
