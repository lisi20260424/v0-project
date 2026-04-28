-- 修复 admin_models 表的 RLS 策略
-- 问题：当前 admin_models_select_enabled 策略可能限制了匿名用户的访问
-- 解决：添加允许所有用户读取 enabled=true 的模型的策略

-- 先删除旧的限制性策略（如果存在）
DROP POLICY IF EXISTS "admin_models_select_enabled" ON public.admin_models;

-- 创建新的 RLS 策略：允许所有用户查看已启用的模型
CREATE POLICY "admin_models_select_enabled"
  ON public.admin_models
  FOR SELECT
  USING (enabled = true);

-- 创建 INSERT 策略：仅允许认证用户（需要后续添加管理员检查）
CREATE POLICY IF NOT EXISTS "admin_models_insert"
  ON public.admin_models
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 创建 UPDATE 策略：仅允许认证用户
CREATE POLICY IF NOT EXISTS "admin_models_update"
  ON public.admin_models
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 创建 DELETE 策略：仅允许认证用户
CREATE POLICY IF NOT EXISTS "admin_models_delete"
  ON public.admin_models
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 验证 admin_providers 表也有类似的策略
-- admin_providers 应该也允许所有用户查看已启用的供应商
CREATE POLICY IF NOT EXISTS "admin_providers_select"
  ON public.admin_providers
  FOR SELECT
  USING (enabled = true);
