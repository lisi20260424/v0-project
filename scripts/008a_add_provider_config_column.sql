-- 给 admin_providers 表添加 config jsonb 列
-- 用于存储每个供应商在不同模型类型下的展示配置（图标、渐变色、标签、跳转链接、起步消耗、产品名等）

ALTER TABLE admin_providers
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
