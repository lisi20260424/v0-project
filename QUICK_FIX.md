# ⚡ 快速修复参考卡

## 问题
- ❌ 收到 Magic Link 邮件而非 OTP
- ❌ 验证码不是 6 位数字

## 解决方案

### 代码修改 ✅（已完成）
```
components/auth/sign-up-form.tsx
- signUp() → signInWithOtp()
- type: "signup" → type: "email"
```

### Supabase 配置 📋（需要您操作）

**访问**: https://app.supabase.com

**路径**: Authentication > Providers > Email

**配置**：
```
❌ Confirm email (Magic Link)    OFF（禁用）
✅ Confirm email (OTP)           ON（启用）
   ├─ OTP Expiry: 600 秒
   └─ OTP Length: 6 位
```

**保存**: 点击 Save 按钮

**等待**: 1-2 分钟生效

## 验证

1. 注册页面: `/auth/sign-up`
2. 填写信息，点击"获取验证码"
3. 检查邮件：应该是 `Your verification code: 123456`
4. 输入 6 位验证码完成注册

## 还是不行？

| 现象 | 原因 | 解决 |
|------|------|------|
| 收到 Magic Link | Magic Link 未禁用 | 设置 Magic Link 为 OFF |
| 8 位验证码 | OTP Length ≠ 6 | 设置为 6 |
| 收到激活邮件 | OTP 未启用 | 设置 OTP 为 ON |
| 验证码过期 | 超过 10 分钟 | 点击重新发送 |

## 详细指南

- 图文配置: `SUPABASE_CONFIG.md`
- 完整说明: `OTP_FIX_GUIDE.md`
