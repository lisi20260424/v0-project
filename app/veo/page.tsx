import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGeneratorServer } from "@/components/video-generator-server"

export const metadata: Metadata = {
  title: "Veo 3.1 视频生成 · 灵境 AI",
  description: "使用 Google Veo 3.1 生成电影级视频，支持文生视频、图生视频、4K 超清输出。",
}

export default function VeoPage() {
  return (
    <ToolPageShell toolId="veo">
      <VideoGeneratorServer />
    </ToolPageShell>
  )
}
