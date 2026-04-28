-- 创建生成配置表（如果不存在）
CREATE TABLE IF NOT EXISTS public.admin_generation_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  music_timeout INT DEFAULT 600,      -- 秒，默认10分钟
  image_timeout INT DEFAULT 300,      -- 秒，默认5分钟
  video_timeout INT DEFAULT 1800,     -- 秒，默认30分钟
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- 插入初始值（如果表为空）
INSERT INTO public.admin_generation_config (id, music_timeout, image_timeout, video_timeout)
VALUES (1, 600, 300, 1800)
ON CONFLICT (id) DO NOTHING;

-- 创建RLS策略允许管理员查询
ALTER TABLE public.admin_generation_config ENABLE ROW LEVEL SECURITY;

-- 允许任何认证用户查询（用于轮询任务时获取超时配置）
CREATE POLICY "allow_select_for_authenticated" 
  ON public.admin_generation_config 
  FOR SELECT 
  USING (true);

-- 仅允许管理员（服务角色）更新
CREATE POLICY "allow_update_for_admin" 
  ON public.admin_generation_config 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
