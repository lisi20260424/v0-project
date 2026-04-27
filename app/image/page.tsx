import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { ImageGeneratorServer } from "@/components/image-generator-server"

export const metadata: Metadata = {
  title: "AI 图像生成 · 灵境 AI",
  description: "聚合 GPT-Image、Nano Banana、Flux 等顶级图像模型，支持中文渲染、图像编辑、风格化创作。",
}

export default async function ImagePage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="image" activeProviderName={provider ?? null}>
      <ImageGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
