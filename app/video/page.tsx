import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "AI 视频生成 | 灵境 AI",
  description: "使用平台后端提供的视频模型 catalog 生成内容。",
}

export default async function VideoPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="video" activeProviderName={provider ?? null}>
      <VideoGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
