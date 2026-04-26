import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { ImageGeneratorServer } from "@/components/image-generator-server"

export const metadata: Metadata = {
  title: "AI 图像生成 · GPT-Image / Nano Banana / Flux · 灵境 AI",
  description: "聚合 OpenAI GPT-Image 2、Google Nano Banana、Flux 等顶级图像模型，支持中文渲染、图像编辑、风格化创作。",
}

export default async function ImagePage() {
  return (
    <ToolPageShell toolId="gpt-image">
      <ImageGeneratorServer />
    </ToolPageShell>
  )
}
