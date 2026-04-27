import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "AI 视频生成 · 灵境 AI",
  description: "聚合 Sora、Veo、可灵等主流视频模型，支持文生视频、图生视频、4K 超清输出。",
}

export default async function VideoPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="video" activeProviderName={provider ?? null}>
      <VideoGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
