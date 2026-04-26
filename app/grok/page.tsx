import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "Grok 视频生成 · 灵境 AI",
  description: "xAI Grok 视频模型，单图驱动成片，视频尺寸自动跟随参考图。",
}

export default function GrokPage() {
  return (
    <ToolPageShell toolId="grok">
      <VideoGeneratorServer />
    </ToolPageShell>
  )
}
