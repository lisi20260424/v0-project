-- scripts/015_admin_list_users_function.sql
-- 管理员获取用户列表 RPC：联 auth.users 拿邮箱与最近登录时间，并支持搜索/筛选/分页
-- 幂等：CREATE OR REPLACE
-- 仅允许通过 service_role 调用（默认 GRANT 已被 REVOKE 移除）

create or replace function public.admin_list_users(
  p_search text default '',
  p_user_type text default '',
  p_status text default '',
  p_vip_tier text default '',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  points integer,
  user_type text,
  status text,
  vip_tier text,
  vip_expires_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.id,
      u.email::text as email,
      p.display_name,
      p.avatar_url,
      p.points,
      p.user_type,
      p.status,
      p.vip_tier,
      p.vip_expires_at,
      p.created_at,
      u.last_sign_in_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    where
      (coalesce(p_search, '') = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.display_name, '') ilike '%' || p_search || '%')
      and (coalesce(p_user_type, '') = '' or p.user_type = p_user_type)
      and (coalesce(p_status, '') = '' or p.status = p_status)
      and (coalesce(p_vip_tier, '') = '' or p.vip_tier = p_vip_tier)
  ),
  counted as (
    select count(*)::bigint as cnt from base
  )
  select b.*, (select cnt from counted) as total_count
  from base b
  order by b.created_at desc
  limit p_limit offset p_offset;
$$;

revoke all on function public.admin_list_users(text, text, text, text, int, int) from public;
revoke all on function public.admin_list_users(text, text, text, text, int, int) from anon, authenticated;
