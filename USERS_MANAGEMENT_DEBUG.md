## 用户管理数据加载排查清单

### 📋 排查步骤

#### 1️⃣ 检查数据库表和字段
在 Supabase SQL Editor 执行：
```sql
-- 检查 profiles 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 检查是否有用户数据
SELECT COUNT(*) as user_count FROM public.profiles;
```

#### 2️⃣ 检查 RPC 函数是否存在
```sql
-- 列出所有 RPC 函数
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'admin%';

-- 或者直接调用测试 RPC
SELECT * FROM public.admin_list_users() LIMIT 1;
```

#### 3️⃣ 如果第 2 步显示 RPC 不存在，需要执行以下脚本：

**脚本 014 - 添加 profiles 表字段：**
```sql
-- 脚本 014：scripts/014_add_user_management_fields.sql
-- 复制文件内容在 SQL Editor 执行
```

**脚本 015 - 创建 RPC 函数：**
```sql
-- 脚本 015：scripts/015_admin_list_users_function.sql
-- 复制文件内容在 SQL Editor 执行
```

#### 4️⃣ 检查应用权限
浏览器 DevTools → Console 查看以下日志：
```
[v0] 获取用户列表: search= ...
[v0] RPC 返回数据: ...
[v0] 返回用户数据: ...
```

如果看到 RPC 错误，记下完整错误信息。

#### 5️⃣ 检查管理员权限
确认当前登录用户是管理员（`app_metadata.role = 'admin'`）：
```sql
SELECT id, email, raw_app_meta_data->>'role' as role 
FROM auth.users 
WHERE email = '你的邮箱';
```

### 🔧 快速修复

如果 RPC 函数确认不存在或权限有问题，执行：

**完整重建脚本（包含 014 和 015）**
```sql
-- 014：添加字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS vip_expires_at timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_type_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_type_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_type_check
    CHECK (user_type IN ('normal','internal','enterprise','admin'));
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('active','suspended','banned'));
END $$;

CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles (user_type);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);

-- 015：创建 RPC 函数
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search text DEFAULT '',
  p_user_type text DEFAULT '',
  p_status text DEFAULT '',
  p_vip_tier text DEFAULT '',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, email text, display_name text, avatar_url text,
  points integer, user_type text, status text,
  vip_tier text, vip_expires_at timestamptz,
  created_at timestamptz, last_sign_in_at timestamptz,
  total_count bigint
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT p.id, u.email::text AS email, p.display_name, p.avatar_url,
           p.points, p.user_type, p.status, p.vip_tier, p.vip_expires_at,
           p.created_at, u.last_sign_in_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE (COALESCE(p_search, '') = '' 
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
```

### ✅ 验证修复
1. 执行上述 SQL 后，刷新浏览器
2. 打开 DevTools → Console，查看 `[v0]` 开头的日志
3. 应该看到用户列表成功加载

### 💡 其他可能的问题
- 确保已正确设置管理员账号（`app_metadata.role = 'admin'`）
- 如果仍有问题，在浏览器 Network 标签检查 `/api/admin/users` 的响应
- 查看 Supabase 日志了解任何 RPC 或权限错误
