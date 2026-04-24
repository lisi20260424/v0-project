# 验证码长度修复指南

## 问题描述
1. 点击"获取验证码"发送的是激活邮件而非 OTP 验证码
2. 邮件中包含 8 位验证码而非 6 位

## 已完成的代码修改

### 文件：`components/auth/sign-up-form.tsx`
**修改内容**：
- ✅ 将 `signUp()` API 替换为 `signInWithOtp({ shouldCreateUser: true })`
- ✅ 将 OTP 验证类型从 `"signup"` 改为 `"email"`
- ✅ 删除了 `password` 字段（OTP 流程不需要）
- ✅ 删除了 `emailRedirectTo` 回调（OTP 流程不需要）

**修改前**：
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: ...,
    data: { display_name: ... }
  }
})
```

**修改后**：
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { display_name: ... }
  }
})
```

OTP 验证改为：
```typescript
await supabase.auth.verifyOtp({
  email,
  token: code,
  type: "email",  // 改为 email（之前是 signup）
})
```

---

## 必须配置的 Supabase 设置

### ⚠️ 关键步骤（必须完成）

为了确保验证码长度为 6 位，需要在 Supabase Dashboard 中配置：

**步骤**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 左侧菜单 → **Authentication** → **Providers** → **Email**
4. 在 **Email Provider** 设置中，找到以下选项：
   - **OTP Expiry Time**: 建议 10-15 分钟
   - **OTP Length**: **设置为 6 位** ✅
5. 点击 **Save** 保存配置

### 验证配置是否生效
- 再次尝试注册
- 点击"获取验证码"
- 检查收到的邮件中的验证码长度是否为 6 位
- 输入 6 位验证码完成注册

---

## 现在的工作流程

### 注册流程
1. 用户填写：昵称（选填）、邮箱、密码、确认密码、同意协议
2. 点击"获取验证码" → **发送 OTP（6 位）到邮箱** ✅
3. 用户收到邮件，复制 6 位验证码
4. 输入验证码，点击"完成注册"
5. 账户创建成功，跳转到仪表板

### 与之前的区别
| 项目 | 之前（错误） | 现在（正确） |
|------|-----------|----------|
| API 调用 | `signUp()` | `signInWithOtp()` |
| 邮件类型 | 账户激活链接 + 8位码 | 6位 OTP 验证码 |
| 是否需要密码验证 | 是 | 否（仅 OTP） |
| 验证类型 | `signup` | `email` |
| 用户体验 | 邮件激活 + OTP验证 | 直接 OTP 验证 |

---

## 代码状态检查清单

- [x] `components/auth/sign-up-form.tsx` - 已修改为 `signInWithOtp()`
- [x] OTP 验证类型已改为 `"email"`
- [ ] **Supabase Dashboard 配置** - 需要手动配置为 6 位（用户操作）
- [x] OTP 输入界面 - 已支持 6 位验证码
- [x] 错误处理 - 已支持新的 OTP 流程

---

## 故障排除

### 问题：仍然收到 8 位验证码
**解决**：检查 Supabase Dashboard 中 Email Provider 的 OTP Length 配置，确保设为 6 位

### 问题：收到激活邮件而非 OTP
**解决**：确认代码已更新为 `signInWithOtp()`，可以检查浏览器控制台是否有错误

### 问题：验证码提示"错误或已过期"
**解决**：
- 检查输入的验证码是否正确
- OTP 有 10-15 分钟的有效期（根据配置）
- 尝试点击"重新发送验证码"获取新的 OTP

---

## 总结
代码已修复，现在通过 OTP 方式进行无密码验证。用户需要在 Supabase Dashboard 中配置 OTP 长度为 6 位以确保邮件中发送的是 6 位验证码。
