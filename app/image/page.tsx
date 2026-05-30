import type { Metadata } from "next"
import { CategoryPageShell } from "@/components/category-page-shell"
import { ImageGeneratorServer } from "@/components/image-generator-server"

export const metadata: Metadata = {
  title: "AI 图像生成 | 灵境 AI",
  description: "使用平台后端提供的图像模型 catalog 生成内容。",
}

export default async function ImagePage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams
  return (
    <CategoryPageShell category="image" activeProviderName={provider ?? null}>
      <ImageGeneratorServer provider={provider} />
    </CategoryPageShell>
  )
}
