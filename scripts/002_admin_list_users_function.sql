-- 管理员用户列表查询函数
-- 联表 auth.users 获取邮箱与最近登录时间，并支持搜索 / 过滤 / 分页
-- 使用 SECURITY DEFINER 通过 service_role 客户端调用（已在 API 中通过 ADMIN_EMAILS 鉴权）

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search text DEFAULT '',
  p_user_type text DEFAULT '',
  p_status text DEFAULT '',
  p_vip_tier text DEFAULT '',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      u.email::text AS email,
      p.display_name,
      p.avatar_url,
      p.points,
      p.user_type,
      p.status,
      p.vip_tier,
      p.vip_expires_at,
      p.created_at,
      u.last_sign_in_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE
      (COALESCE(p_search, '') = ''
        OR u.email ILIKE '%' || p_search || '%'
        OR COALESCE(p.display_name, '') ILIKE '%' || p_search || '%')
      AND (COALESCE(p_user_type, '') = '' OR p.user_type = p_user_type)
      AND (COALESCE(p_status, '') = '' OR p.status = p_status)
      AND (COALESCE(p_vip_tier, '') = '' OR p.vip_tier = p_vip_tier)
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM base
  )
  SELECT b.*, (SELECT cnt FROM counted) AS total_count
  FROM base b
  ORDER BY b.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, text, text, text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users(text, text, text, text, int, int) FROM anon, authenticated;
