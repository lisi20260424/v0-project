-- 修复 vip_tier 约束：只支持 monthly / annual / lifetime，null 值也允许
-- 现有约束可能包含过期的取值，需要重建

-- 1. 删除旧约束（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_vip_tier_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_vip_tier_check;
  END IF;
END $$;

-- 2. 创建新约束：允许 NULL、monthly、annual、lifetime
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vip_tier_check
  CHECK (vip_tier IS NULL OR vip_tier IN ('monthly', 'annual', 'lifetime'));

-- 3. 验证约束已生效
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' AND cc.constraint_name = 'profiles_vip_tier_check';
