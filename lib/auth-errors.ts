/**
 * 把 Supabase Auth 常见英文错误翻译成中文，便于用户理解
 */
export function translateAuthError(err: unknown, fallback = "操作失败，请稍后重试"): string {
  const msg = err instanceof Error ? err.message : String(err ?? "")
  const lower = msg.toLowerCase()

  if (!msg) return fallback

  // 速率限制
  if (lower.includes("email rate limit") || lower.includes("rate limit")) {
    return "邮件发送已达上限（Supabase 免费版每小时 2 封），请 1 小时后再试，或在 Supabase 后台配置自定义 SMTP"
  }
  if (lower.includes("over_email_send_rate_limit")) {
    return "发送过于频繁，请稍后再试"
  }

  // 邮件相关
  if (lower.includes("smtp") || lower.includes("email not sent")) {
    return "邮件发送失败，请检查 Supabase 邮件服务配置"
  }
  if (lower.includes("email address is invalid") || lower.includes("email_address_invalid")) {
    return "邮箱地址格式不正确"
  }

  // 密码
  if (lower.includes("password should be at least")) {
    return "密码长度不足，请至少 8 位"
  }
  if (lower.includes("weak password") || lower.includes("password is too weak")) {
    return "密码强度不足，建议包含大小写字母和数字"
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "邮箱或密码错误"
  }
  if (lower.includes("incorrect password") || lower.includes("wrong password")) {
    return "密码错误"
  }

  // 注册 / 登录
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "该邮箱已注册，请直接登录"
  }
  if (lower.includes("user not found") || lower.includes("no user")) {
    return "该邮箱尚未注册，请先注册"
  }
  if (lower.includes("email not confirmed")) {
    return "邮箱尚未验证，请查收验证邮件"
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "注册功能已关闭，请联系管理员"
  }

  // OTP / Token
  if (lower.includes("token has expired") || lower.includes("otp expired")) {
    return "验证码已过期，请重新获取"
  }
  if (lower.includes("invalid token") || lower.includes("token is invalid") || lower.includes("otp_expired")) {
    return "验证码错误或已过期"
  }
  if (lower.includes("token not found")) {
    return "验证码无效，请重新获取"
  }

  // OAuth
  if (lower.includes("oauth") && lower.includes("not enabled")) {
    return "该第三方登录方式未启用，请在 Supabase 后台开启"
  }

  // 网络 / 其他
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "网络连接失败，请检查网络后重试"
  }

  return msg
}
