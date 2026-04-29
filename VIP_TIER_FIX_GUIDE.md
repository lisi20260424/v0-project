# VIP 等级约束修复指南

## 问题描述
在设置用户会员等级时出现错误：`profiles_vip_tier_check` 约束违反

## 根本原因
数据库中 `profiles` 表的 `vip_tier` 列 CHECK 约束只允许以下值：
- `NULL`（无会员）
- `'monthly'`（月度会员）
- `'annual'`（年度会员）
- `'lifetime'`（终身会员）

但代码中之前使用了 `'free'` 这个不被约束允许的值。

## 修复步骤

### 1. 在 Supabase SQL Editor 中执行脚本 018

```sql
-- 删除旧约束（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_vip_tier_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_vip_tier_check;
  END IF;
END $$;

-- 创建新约束：允许 NULL、monthly、annual、lifetime
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_vip_tier_check
  CHECK (vip_tier IS NULL OR vip_tier IN ('monthly', 'annual', 'lifetime'));

-- 验证约束已生效
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' AND cc.constraint_name = 'profiles_vip_tier_check';
```

### 2. 代码修改已完成

以下修改已在代码中实施：

✅ `lib/admin.ts`
- 移除了 `VIP_TIER_LABELS` 中的 "free" 项
- 保留了有效的三个会员等级：monthly、annual、lifetime

✅ `components/admin/user-edit-dialog.tsx`
- 初始状态改为空字符串而不是 "free"
- 下拉菜单中的"无会员"选项对应空值
- 会员到期日期输入框条件改为：`!vipTier || vipTier === "lifetime"`

✅ `components/admin/users-manager.tsx`
- 无会员状态显示"无会员"而不是 "free"

✅ `app/api/admin/users/[id]/route.ts`
- API 路由已正确处理"free"、""、null 这些值，统一转换为 NULL

### 3. 验证修复

执行以下 SQL 查询验证约束：

```sql
-- 查看约束定义
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles';

-- 尝试插入有效值（应该成功）
INSERT INTO public.profiles (id, vip_tier) VALUES ('test-id', 'monthly');
INSERT INTO public.profiles (id, vip_tier) VALUES ('test-id-2', NULL);

-- 尝试插入无效值（应该失败）
INSERT INTO public.profiles (id, vip_tier) VALUES ('test-id-3', 'free');  -- 应该报错
```

## 现在可以进行的操作

编辑对话框中的会员等级下拉菜单选项：
- "无会员"（空值 → NULL）
- "月度会员"（monthly）
- "年度会员"（annual）
- "终身会员"（lifetime）

选择任何选项后点击保存，应该能正确保存到数据库。

## 注意事项

- 会员到期日期仅在选择月度或年度会员时启用
- 终身会员不需要设置到期日期
- 所有新值都会正确通过数据库约束验证
