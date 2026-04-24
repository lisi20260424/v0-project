import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { ImageGenerator } from "@/components/image-generator"

export const metadata: Metadata = {
  title: "AI 图像生成 · GPT-Image / Nano Banana / Flux · 灵境 AI",
  description: "聚合 OpenAI GPT-Image 2、Google Nano Banana、Flux 等顶级图像模型，支持中文渲染、图像编辑、风格化创作。",
}

type SearchParams = Promise<{ model?: string }>

export default async function ImagePage({ searchParams }: { searchParams: SearchParams }) {
  const { model } = await searchParams
  const defaultModelId =
    model === "nano-banana" ? "nano-banana" : model === "flux" ? "flux" : "gpt-image"

  return (
    <ToolPageShell toolId="gpt-image">
      <ImageGenerator defaultModelId={defaultModelId} />
    </ToolPageShell>
  )
}
