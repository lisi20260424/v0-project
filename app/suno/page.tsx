import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { MusicGenerator } from "@/components/music-generator"

export const metadata: Metadata = {
  title: "Suno 音乐生成 · 灵境 AI",
  description: "Suno V5 中文歌词 + 多风格伴奏生成，支持 4 分钟长曲、男女合唱、纯音乐导出。",
}

export default function SunoPage() {
  return (
    <ToolPageShell toolId="suno">
      <MusicGenerator />
    </ToolPageShell>
  )
}
