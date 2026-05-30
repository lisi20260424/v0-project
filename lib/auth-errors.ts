export function translateAuthError(err: unknown, fallback = "操作失败，请稍后重试"): string {
  const msg = err instanceof Error ? err.message : String(err ?? "")
  const lower = msg.toLowerCase()

  if (!msg) return fallback
  if (lower.includes("rate limit") || lower.includes("too frequently")) return "发送过于频繁，请稍后再试"
  if (lower.includes("smtp") || lower.includes("email not sent")) return "邮件发送失败，请检查邮件服务配置"
  if (lower.includes("email") && lower.includes("invalid")) return "邮箱地址格式不正确"
  if (lower.includes("password") && (lower.includes("at least") || lower.includes("too short"))) return "密码长度不足，请至少 8 位"
  if (lower.includes("invalid login") || lower.includes("invalid email or password") || lower.includes("invalid_credentials")) return "邮箱或密码错误"
  if (lower.includes("already registered")) return "该邮箱已注册，请直接登录"
  if (lower.includes("not found")) return "账号或验证码不存在"
  if (lower.includes("expired")) return "验证码已过期，请重新获取"
  if (lower.includes("invalid otp") || lower.includes("invalid token")) return "验证码错误或已过期"
  if (lower.includes("oauth") && lower.includes("not enabled")) return "该第三方登录方式未启用"
  if (lower.includes("network") || lower.includes("fetch failed")) return "网络连接失败，请检查网络后重试"

  return msg
}
