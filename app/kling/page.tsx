import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGenerator } from "@/components/video-generator"

export const metadata: Metadata = {
  title: "可灵 2.0 视频生成 · 灵境 AI",
  description: "快手可灵 2.0 中文理解精准，人物动作自然流畅，最懂中文创作。",
}

export default function KlingPage() {
  return (
    <ToolPageShell toolId="kling">
      <VideoGenerator
        accentLabel="★"
        models={[
          { id: "kling-standard", name: "可灵 标准", desc: "日常创作，性价比之选", price: 20 },
          { id: "kling-pro", name: "可灵 Pro", tag: "推荐", desc: "画质提升，动作更自然", price: 35 },
          { id: "kling-master", name: "可灵 大师版", tag: "Master", desc: "顶级画质，适合商业成片", price: 70 },
        ]}
        defaultModelId="kling-pro"
        ratios={[
          { id: "916", label: "竖屏 9:16", ratio: "9:16" },
          { id: "169", label: "横屏 16:9", ratio: "16:9" },
          { id: "11", label: "方形 1:1", ratio: "1:1" },
        ]}
        durations={[
          { id: "5s", label: "5 秒" },
          { id: "10s", label: "10 秒" },
        ]}
        examplePrompts={[
          "中国水墨画风格，远山云海翻涌，一叶扁舟顺流而下，诗意悠远",
          "宫崎骏动画风格，少女站在樱花庭院中，粉色花瓣随风飞舞，柔和阳光洒下",
          "一条威严的中国龙穿梭于云雾缭绕的群山之间，鳞片在阳光下闪烁，奇幻史诗氛围",
        ]}
      />
    </ToolPageShell>
  )
}
