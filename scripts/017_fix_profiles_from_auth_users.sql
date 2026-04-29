-- 1. 确保触发器函数存在
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 删除旧的触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 创建新的触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 为现有的 auth.users 用户创建 profiles 记录
INSERT INTO public.profiles (id, email, display_name, created_at, status, user_type)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
  u.created_at,
  'active' as status,
  CASE 
    WHEN (u.raw_app_meta_data->>'role') = 'admin' THEN 'admin'
    ELSE 'normal'
  END as user_type
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 5. 验证数据是否正确导入
SELECT id, email, display_name, status, user_type, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 10;
