# Supabase 邮箱 OTP 验证码正确配置指南

## 问题根源

目前收到的 **Magic Link 邮件**是因为 Supabase 的默认邮件模板中包含了 `{{ .ConfirmationURL }}`（登录链接）而非 `{{ .Token }}`（验证码）。

**错误的邮件模板示例**：
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

**正确的 OTP 邮件模板**：
```html
<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
```

## 解决步骤

### 第一步：进入 Supabase Dashboard

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 左侧菜单找到 **Authentication** 

### 第二步：找到邮件模板设置

在 Authentication 页面中，找到 **Email Templates** 或 **Providers** > **Email** 的邮件模板区域

可能的路径：
- `Authentication > Email Templates`
- `Authentication > Providers > Email > Email Templates`
- `Authentication > Providers > Email` 中的模板选项

### 第三步：修改邮件模板

找到 **Confirm email** 或 **Magic Link** 的邮件模板，修改内容：

**将现有模板改为**：

```html
<h2>Your Verification Code</h2>

<p>Please enter this verification code: <strong>{{ .Token }}</strong></p>

<p>This code will expire in 10 minutes.</p>
```

**关键变量**：
- `{{ .Token }}` - 6 位验证码（必须使用）
- `{{ .ConfirmationURL }}` - 登录链接（不要使用）

### 第四步：保存模板

点击 **Save** 或 **Update** 按钮保存邮件模板

配置生效通常需要 1-2 分钟

## 验证配置生效

1. 打开注册页面 `http://localhost:3000/auth/sign-up`
2. 填写邮箱、密码、昵称，勾选协议
3. 点击"获取验证码"
4. 检查收到的邮件：

**正确的邮件内容**：
```
Your Verification Code

Please enter this verification code: 123456

This code will expire in 10 minutes.
```

**错误的邮件内容（Magic Link）**：
```
Magic Link

Follow this link to login:
[Login Link]
```

5. 如果收到正确格式，输入 6 位验证码即可完成注册

## 代码已修改完成

注册表单（`components/auth/sign-up-form.tsx`）已更新为：

```typescript
// 发送 OTP
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { display_name: displayName },
  },
})

// 验证 OTP
const { error } = await supabase.auth.verifyOtp({
  email,
  token: code,
  type: 'email',
})
```

## 邮件模板示例

### 最简单的 OTP 模板

```html
<h2>Verification Code</h2>
<p>Your code: {{ .Token }}</p>
```

### 更完整的 OTP 模板

```html
<h2>Welcome to 灵境 AI</h2>

<p>Your verification code is:</p>

<p style="font-size: 24px; font-weight: bold; color: #007bff;">
  {{ .Token }}
</p>

<p>This code expires in 10 minutes.</p>

<p>If you didn't request this code, please ignore this email.</p>
```

## 快速检查清单

- [ ] 已进入 Supabase Dashboard Authentication 区域
- [ ] 已找到邮件模板编辑器
- [ ] 已修改邮件模板，包含 `{{ .Token }}`
- [ ] 已删除或注释掉 `{{ .ConfirmationURL }}`
- [ ] 已点击 Save 保存
- [ ] 已等待 1-2 分钟生效
- [ ] 已测试注册，收到 6 位验证码
- [ ] 已成功验证 6 位验证码完成注册
