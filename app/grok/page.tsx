import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGenerator } from "@/components/video-generator"

export const metadata: Metadata = {
  title: "Grok 视频生成 · 灵境 AI",
  description: "xAI Grok 视频模型，单图驱动成片，视频尺寸自动跟随参考图。",
}

export default function GrokPage() {
  return (
    <ToolPageShell toolId="grok">
      <VideoGenerator
        accentLabel="✦"
        imageCapability="single"
        models={[
          { id: "grok-video", name: "Grok Video", desc: "标准版 · 单图驱动 · 出片迅速", price: 15 },
          { id: "grok-video-pro", name: "Grok Video Pro", tag: "Pro", desc: "专业版 · 更高分辨率与动作自然度", price: 35 },
        ]}
        defaultModelId="grok-video"
        ratios={[
          { id: "916", label: "竖屏", ratio: "9:16" },
          { id: "169", label: "横屏", ratio: "16:9" },
        ]}
        durations={[
          { id: "6s", label: "6 秒" },
          { id: "10s", label: "10 秒" },
          { id: "15s", label: "15 秒" },
        ]}
        counts={[1, 3, 5, 10]}
        examplePrompts={[
          "卡通风格，一只可爱的猫咪在吃东西，特写慢放镜头，自然光",
          "少女在海边奔跑，发丝随海风飞舞，夕阳金光铺满沙滩，电影感色调",
          "赛博朋克街头，机械臂少年回眸一笑，霓虹雨夜，快速变焦",
        ]}
      />
    </ToolPageShell>
  )
}
