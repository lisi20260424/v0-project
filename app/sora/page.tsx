import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGenerator } from "@/components/video-generator"

export const metadata: Metadata = {
  title: "Sora 2 视频生成 · 灵境 AI",
  description: "OpenAI Sora 2 高保真世界模拟器，支持 10s/15s 时长，物理一致性强。",
}

export default function SoraPage() {
  return (
    <ToolPageShell toolId="sora">
      <VideoGenerator
        accentLabel="✦"
        models={[
          { id: "sora-2", name: "Sora 2", desc: "标准版 · 速度快 · 性价比高", price: 50 },
          { id: "sora-2-pro", name: "Sora 2 Pro", tag: "Pro", desc: "专业版 · 电影级细节与光影", price: 120 },
        ]}
        defaultModelId="sora-2"
        channels={[
          { id: "reverse", label: "逆向版", desc: "基于逆向接入，价格更低" },
          { id: "official", label: "官方稳定版", desc: "OpenAI 官方接口，稳定性最高" },
        ]}
        ratios={[
          { id: "916", label: "竖屏 9:16", ratio: "9:16" },
          { id: "169", label: "横屏 16:9", ratio: "16:9" },
        ]}
        durations={[
          { id: "10s", label: "10 秒" },
          { id: "15s", label: "15 秒" },
        ]}
        examplePrompts={[
          "一只宇航员漂浮在地球上空的深空中，宇航服反射星光，远处是绚丽的星云，史诗级广角镜头",
          "东京涩谷夜晚的十字路口，霓虹广告牌倒映在雨水中，行人撑伞快速穿过斑马线，慢动作",
          "水下特写，一群发光水母在深海缓缓游动，光线从水面穿透下来形成丁达尔效应",
        ]}
      />
    </ToolPageShell>
  )
}
