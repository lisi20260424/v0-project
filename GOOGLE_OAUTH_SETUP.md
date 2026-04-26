# Google OAuth 配置指南

## 问题诊断

点击 Google 账号注册时出现"该内容被屏蔽了"错误，这通常是因为：
1. Google OAuth 在 Supabase Dashboard 中未启用
2. Google OAuth 凭证配置不正确
3. 重定向 URI 未正确配置

## 解决方案

### 步骤 1：在 Google Cloud Console 创建 OAuth 凭证

1. 访问 https://console.cloud.google.com
2. 选择或创建一个项目
3. 进入 **APIs & Services** → **Credentials**
4. 点击 **+ Create Credentials** → **OAuth 2.0 Client ID**
5. 选择应用类型为 **Web Application**
6. 在 **Authorized redirect URIs** 中添加：
   ```
   https://<your-project>.supabase.co/auth/v1/callback?provider=google
   ```
   （将 `<your-project>` 替换为您的 Supabase 项目名称）
7. 点击 **Create**
8. 复制 **Client ID** 和 **Client Secret**

### 步骤 2：在 Supabase Dashboard 中配置 Google OAuth

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **Authentication** → **Providers**
4. 找到 **Google** 提供商
5. 点击打开 Google 配置
6. 切换 **Enable Sign in with Google** 到 **ON**
7. 输入从 Google Cloud Console 复制的：
   - **Client ID**
   - **Client Secret**
8. 点击 **Save**

### 步骤 3：设置 Supabase 重定向 URL

在 Supabase Dashboard 中：
1. 进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 部分，添加您的应用回调 URL：
   ```
   http://localhost:3000/auth/callback
   ```
   和生产环境：
   ```
   https://yourapp.com/auth/callback
   ```
3. 点击 **Save**

## 调试步骤

如果仍然出现错误，按照以下步骤排查：

### 检查浏览器控制台

1. 打开浏览器开发者工具 (F12)
2. 进入 **Console** 标签
3. 点击 Google 登录按钮
4. 查看是否有错误信息，常见的包括：
   - `redirect_uri_mismatch` - 重定向 URI 不匹配
   - `invalid_client` - Client ID 或 Client Secret 错误
   - `access_denied` - 用户拒绝授权

### 检查 Supabase 日志

1. 进入 Supabase Dashboard
2. 选择您的项目
3. 进入 **Logs** → **Auth logs**
4. 查看最近的认证尝试，了解具体错误信息

### 验证环境变量

检查项目中的环境变量是否正确设置：

```bash
# 查看环境变量（注意：不要泄露敏感信息）
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 测试流程

配置完成后，按照以下步骤测试：

1. 进入注册页面 `/auth/sign-up`
2. 点击 **使用 Google 账号继续** 按钮
3. 使用 Google 账号授权
4. 完成后应该跳转到仪表板

## 常见错误及解决方案

| 错误 | 原因 | 解决方案 |
|------|------|--------|
| `redirect_uri_mismatch` | 重定向 URI 不一致 | 确保 Google 和 Supabase 中的重定向 URI 完全一致 |
| `invalid_client` | Client ID 或密钥错误 | 检查 Google 控制台中复制的 Client ID 和 Secret 是否正确 |
| `access_denied` | 用户拒绝授权 | 这是正常的，用户可以重试 |
| `provider_not_enabled` | Google OAuth 未启用 | 在 Supabase Dashboard 中启用 Google 提供商 |

## 相关文件

- 回调路由: `app/auth/callback/route.ts`
- OAuth 按钮: `components/auth/oauth-buttons.tsx`
- 错误页面: `app/auth/error/page.tsx`
