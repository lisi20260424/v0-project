-- 用户管理：为 profiles 增加用户状态、用户类型字段
-- 状态用于"封禁/暂停/启用"，用户类型用于区分普通/内部/企业/管理员等

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'normal';

-- 状态合法值：active 正常、suspended 暂停、banned 封禁
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended', 'banned'));

-- 用户类型合法值：normal 普通、internal 内部、enterprise 企业、admin 管理员
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('normal', 'internal', 'enterprise', 'admin'));

-- 会员等级合法值（沿用已有 vip_tier 列）
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vip_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vip_tier_check
  CHECK (vip_tier IS NULL OR vip_tier IN ('free', 'basic', 'pro', 'ultra'));

-- 索引便于按状态/类型筛选
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles (user_type);
CREATE INDEX IF NOT EXISTS profiles_vip_tier_idx ON public.profiles (vip_tier);
