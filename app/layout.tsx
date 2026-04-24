import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { MembershipProvider } from "@/components/membership-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "灵境 AI · 一站式多模态 AI 创作平台",
  description:
    "灵境 AI 聚合全球主流 AI 模型，提供 Veo / Sora / 可灵视频生成、GPT-Image / Nano Banana 图像生成、Suno 音乐生成、AI 对话等一站式创作能力。",
  keywords: ["AI 视频生成", "AI 图像生成", "AI 音乐", "Veo", "Sora", "可灵", "GPT-Image", "Nano Banana", "Suno", "AI SaaS"],
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <MembershipProvider>{children}</MembershipProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
