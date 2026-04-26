import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { MusicGeneratorServer } from "@/components/music-generator-server"

export const metadata: Metadata = {
  title: "AI 音乐生成 · 灵境 AI",
  description: "Suno V5 等主流音乐模型，支持中文歌词、男女合唱、纯音乐导出与商用授权。",
}

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="music" activeProviderName={provider ?? null}>
      <MusicGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
