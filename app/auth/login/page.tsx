import { Suspense } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "登录 · 灵境 AI",
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        <LoginForm />
      </AuthGuard>
    </Suspense>
  )
}
