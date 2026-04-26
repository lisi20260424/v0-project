import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "可灵 2.0 视频生成 · 灵境 AI",
  description: "快手可灵 2.0 中文理解精准，人物动作自然流畅，最懂中文创作。",
}

export default function KlingPage() {
  return (
    <ToolPageShell toolId="kling">
      <VideoGeneratorServer />
    </ToolPageShell>
  )
}
