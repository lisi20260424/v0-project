export function translateAuthError(err: unknown, fallback = "操作失败，请稍后重试"): string {
  const msg = err instanceof Error ? err.message : String(err ?? "")
  const lower = msg.toLowerCase()

  if (!msg) return fallback

  if (
    lower.includes("otp send too frequently") ||
    lower.includes("too many otp requests") ||
    lower.includes("email rate limit") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "验证码请求过于频繁，请稍后再试"
  }
  if (lower.includes("smtp") || lower.includes("email not sent") || lower.includes("send otp failed")) {
    return "邮件发送失败，请检查邮件服务配置"
  }
  if (lower.includes("email address is invalid") || lower.includes("email_address_invalid")) {
    return "邮箱地址格式不正确"
  }
  if (lower.includes("password should be at least") || lower.includes("password must be at least")) {
    return "密码长度不足，请至少 8 位"
  }
  if (lower.includes("weak password") || lower.includes("password is too weak")) {
    return "密码强度不足，建议包含大小写字母和数字"
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials") || lower.includes("invalid email or password")) {
    return "邮箱或密码错误"
  }
  if (lower.includes("incorrect password") || lower.includes("wrong password")) {
    return "密码错误"
  }
  if (lower.includes("user already registered") || lower.includes("already been registered") || lower.includes("email already registered")) {
    return "该邮箱已注册，请直接登录"
  }
  if (lower.includes("user not found") || lower.includes("no user")) {
    return "该邮箱尚未注册，请先注册"
  }
  if (lower.includes("email not confirmed")) {
    return "邮箱尚未验证，请先完成邮箱验证"
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "注册功能已关闭，请联系管理员"
  }
  if (lower.includes("token has expired") || lower.includes("otp expired")) {
    return "验证码已过期，请重新获取"
  }
  if (lower.includes("invalid token") || lower.includes("token is invalid") || lower.includes("invalid otp") || lower.includes("otp_expired")) {
    return "验证码错误或已过期"
  }
  if (lower.includes("token not found") || lower.includes("otp not found")) {
    return "验证码无效，请重新获取"
  }
  if (lower.includes("oauth") && lower.includes("not enabled")) {
    return "该第三方登录方式未启用，请联系管理员"
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "网络连接失败，请检查网络后重试"
  }

  return msg
}
