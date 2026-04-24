# Supabase 邮件 OTP 配置指南（图文版）

## 现象对比

### ❌ 错误现象（目前的情况）
收到邮件内容：
```
Magic Link

Follow this link to login:
[长的登录链接 URL]
```

### ✅ 正确现象（配置后）
收到邮件内容：
```
Your verification code: 123456
```

---

## 配置步骤

### 第 1 步：登录 Supabase Dashboard

访问 https://app.supabase.com 并登录您的账户

---

### 第 2 步：进入 Authentication 菜单

1. 在左侧菜单中找到 **Authentication**
2. 点击展开菜单

```
Supabase 仪表板
├── Project
│   ├── Home
│   ├── SQL Editor
│   ├── Database
│   ├── Storage
│   ├── Edge Functions
│   ├── Vector
│   ├── Realtime
│   ├── Authentication  ← 点击这里
│   └── Logs
```

---

### 第 3 步：进入 Providers 设置

1. 在 Authentication 下找到 **Providers** 选项
2. 点击 **Providers**

```
Authentication
├── Users
├── Providers  ← 点击这里
├── Policies
├── URL Configuration
├── Integrations
└── Settings
```

---

### 第 4 步：打开 Email 提供商配置

1. 在 Providers 列表中找到 **Email**
2. 点击 **Email** 行

```
Providers 列表：
├── Phone (SMS)
├── Email  ← 点击这一行
├── Kakao
├── Google
└── ...
```

---

### 第 5 步：配置关键选项

打开 Email 提供商配置后，会看到以下选项：

#### 5a. 禁用 Magic Link（关键）

找到 **Confirm email (Magic Link)** 选项：

```
☐ Confirm email (Magic Link)  ← 必须关闭（OFF）
```

- 如果该项已勾选（☑），需要点击它来取消勾选
- 确保显示为 ☐（未勾选）

#### 5b. 启用 OTP（关键）

找到 **Confirm email (OTP)** 选项：

```
☑ Confirm email (OTP)  ← 必须打开（ON）
  ├─ OTP Expiry: [600]  秒   (设置为 600 秒 = 10 分钟)
  └─ OTP Length: [6]   位    (设置为 6)
```

确保：
- ☑ **Confirm email (OTP)** 已勾选
- **OTP Expiry** 字段设置为 `600`（秒）
- **OTP Length** 字段设置为 `6`（位数）

#### 5c. 其他选项（可选）

```
☑ Disable sign up (if enabled)  - 根据需要配置
☑ Double Confirm Changes        - 根据需要配置
☑ Secure Email Change           - 根据需要配置
```

---

### 第 6 步：保存配置

配置完成后，找到页面下方的按钮：

```
[Cancel]  [Save]  或  [Update]
          ↑ 点击这个按钮
```

点击 **Save** 或 **Update** 按钮保存所有更改

---

### 第 7 步：等待生效

配置保存后，需要等待 **1-2 分钟**，Supabase 会同步配置到邮件发送服务。

**等待期间请勿重复点击 Save**

---

## 验证配置

配置保存 1-2 分钟后，进行以下测试：

### 测试步骤

1. 打开注册页面：
   ```
   http://localhost:3000/auth/sign-up
   ```

2. 填写测试信息：
   ```
   邮箱: test@example.com（使用您能接收的真实邮箱）
   昵称: TestUser
   密码: TestPassword123!
   确认密码: TestPassword123!
   ☑ 同意用户协议
   ```

3. 点击 **获取验证码** 按钮

4. 检查邮箱：
   - 打开您的邮件收收箱
   - 查找来自 `noreply@mail.app.supabase.io` 的新邮件
   - **应该看到 6 位数字验证码**，例如：
     ```
     Your verification code: 123456
     ```

5. 复制验证码：
   - 从邮件中复制 6 位验证码
   - 粘贴到网页表单中
   - 点击 **验证** 或 **完成注册** 按钮

6. 验证成功：
   - 应该跳转到仪表板页面 `/dashboard`
   - 账户创建成功

---

## 完整配置检查清单

在进行测试前，请确保完成了以下所有步骤：

- [ ] 登录了 Supabase Dashboard
- [ ] 进入了 Authentication > Providers > Email
- [ ] **Magic Link 已关闭**（☐ Confirm email (Magic Link) 未勾选）
- [ ] **OTP 已打开**（☑ Confirm email (OTP) 已勾选）
- [ ] OTP Expiry 设置为 600
- [ ] OTP Length 设置为 6
- [ ] 点击了 Save 按钮
- [ ] 等待了 1-2 分钟
- [ ] 尝试了新注册
- [ ] 收到的邮件包含 **6 位数字**（如 123456）
- [ ] 成功输入验证码完成注册

---

## 常见错误

### ❌ 错误 1：Magic Link 仍未禁用
**表现**：收到的邮件仍然是登录链接

**原因**：`Confirm email (Magic Link)` 仍然勾选

**修复**：
1. 返回 Email 提供商配置
2. 确保 `Confirm email (Magic Link)` 显示为 ☐（未勾选）
3. 重新点击 Save
4. 等待 1-2 分钟
5. 清除浏览器缓存后重新测试

### ❌ 错误 2：OTP 未启用
**表现**：收到邮件，但没有验证码内容

**原因**：`Confirm email (OTP)` 未勾选

**修复**：
1. 返回 Email 提供商配置
2. 确保 `Confirm email (OTP)` 显示为 ☑（已勾选）
3. 重新点击 Save
4. 等待 1-2 分钟
5. 重新测试

### ❌ 错误 3：验证码长度不是 6 位
**表现**：收到的验证码是 8 位或其他长度

**原因**：OTP Length 未设置为 6

**修复**：
1. 返回 Email 提供商配置
2. 找到 `OTP Length` 字段
3. 改为 `6`
4. 重新点击 Save
5. 等待 1-2 分钟
6. 重新测试

### ❌ 错误 4：验证码过期或提示错误
**表现**：输入验证码后提示 "Invalid token" 或 "Code expired"

**原因**：
- 验证码输入错误
- 验证码已过期（有效期 10 分钟）
- 邮箱地址不匹配

**修复**：
1. 检查输入的验证码是否与邮件完全一致（6 位数字）
2. 如果已过期，点击 **重新发送验证码**
3. 立即输入新的验证码
4. 确保邮箱地址未更改

---

## 需要帮助？

如果按照以上步骤仍未解决问题，请检查：

1. **Supabase 邮件设置**
   - 是否配置了 SMTP 或 Resend 邮件提供商
   - 邮件是否被标记为垃圾邮件

2. **浏览器缓存**
   - 清除浏览器缓存
   - 尝试隐私/无痕模式重新测试

3. **Supabase 日志**
   - 在 Supabase Dashboard 查看 Logs
   - 检查邮件发送是否有错误

4. **代码检查**
   - 确保已使用最新版本的 `/components/auth/sign-up-form.tsx`
   - 检查浏览器控制台是否有 JavaScript 错误
