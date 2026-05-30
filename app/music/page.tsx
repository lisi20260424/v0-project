import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { MusicGeneratorServer } from "@/components/music-generator-server"

export const metadata: Metadata = {
  title: "AI 音乐生成 | 灵境 AI",
  description: "使用平台后端提供的音乐模型 catalog 生成内容。",
}

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="music" activeProviderName={provider ?? null}>
      <MusicGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
