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

目前收到的是 **Magic Link**（登录链接）而不是验证码，这是因为 Supabase 默认启用了 Magic Link。需要在 Supabase Dashboard 中进行以下配置：

**步骤**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 左侧菜单 → **Authentication** → **Providers** → **Email**

**配置详情**：

#### ❌ 必须禁用 Magic Link
```
[ ] Confirm email (Magic Link)
    └─ Toggle: OFF（关闭）
```
这是导致收到登录链接邮件的原因

#### ✅ 必须启用 OTP
```
[x] Confirm email (OTP)
    ├─ Toggle: ON（打开）
    ├─ OTP Expiry: 600（秒）- 10 分钟有效期
    └─ OTP Length: 6（数字）- 验证码长度
```

**保存**：点击 **Save** 或 **Update** 按钮

### 验证配置是否生效
1. 配置保存后，等待 1-2 分钟生效
2. 再次尝试注册
3. 点击"获取验证码"
4. 检查收到的邮件：
   - ❌ 错误：Magic Link 邮件（标题：Follow this link to login）
   - ✅ 正确：Your verification code: 123456
5. 输入 6 位验证码完成注册

### 如何确认配置已正确应用
- 邮件标题应为 `Your verification code` 或 `Verify your email`
- 邮件内容应包含 **6 位数字**（如 `123456`）
- 不应该包含任何登录链接

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

### 问题 1：仍然收到 Magic Link 登录邮件
**原因**：Supabase Dashboard 中 Magic Link 仍未禁用

**解决步骤**：
1. 进入 Authentication > Providers > Email
2. 确保 `Confirm email (Magic Link)` 已关闭（OFF）
3. 确保 `Confirm email (OTP)` 已打开（ON）
4. 点击 Save 按钮
5. 等待 1-2 分钟生效
6. 重新测试注册

### 问题 2：收到的验证码不是 6 位
**原因**：OTP Length 未正确设置为 6

**解决步骤**：
1. 进入 Authentication > Providers > Email
2. 找到 OTP 配置中的 `OTP Length` 字段
3. 改为 `6`
4. 点击 Save 按钮
5. 重新测试

### 问题 3：验证码过期或提示"错误"
**原因**：
- 输入的验证码错误
- 验证码已过期（10 分钟）
- 邮箱与发送时不一致

**解决步骤**：
1. 检查输入的验证码是否与邮件中完全一致
2. 如果过期，点击"重新发送验证码"按钮
3. 获取新的验证码后立即输入

### 问题 4：收到的还是激活邮件而非 OTP
**原因**：可能 Dashboard 配置未完全保存

**解决步骤**：
1. 刷新 Dashboard 页面
2. 重新进入 Authentication > Providers > Email
3. 检查配置是否仍然如预期
4. 重新保存一次
5. 清除浏览器缓存后重新测试

---

## 总结
代码已修复，现在通过 OTP 方式进行无密码验证。用户需要在 Supabase Dashboard 中配置 OTP 长度为 6 位以确保邮件中发送的是 6 位验证码。
