import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "Sora 2 视频生成 · 灵境 AI",
  description: "OpenAI Sora 2 高保真世界模拟器，支持 10s/15s 时长，物理一致性强。",
}

export default function SoraPage() {
  return (
    <ToolPageShell toolId="sora">
      <VideoGeneratorServer />
    </ToolPageShell>
  )
}
