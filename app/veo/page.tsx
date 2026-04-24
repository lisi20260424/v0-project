import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { VideoGenerator } from "@/components/video-generator"

export const metadata: Metadata = {
  title: "Veo 3.1 视频生成 · 灵境 AI",
  description: "使用 Google Veo 3.1 生成电影级视频，支持文生视频、图生视频、4K 超清输出。",
}

export default function VeoPage() {
  return (
    <ToolPageShell toolId="veo">
      <VideoGenerator
        accentLabel="◇"
        models={[
          { id: "veo-3.1-fast", name: "Veo 3.1 Fast", desc: "速度优先 · 标清输出，适合预览草稿", price: 30 },
          { id: "veo-3.1-fast-4k", name: "Veo 3.1 Fast 4K", tag: "推荐", desc: "画质优先 · 4K 超清", price: 40 },
          { id: "veo-3.1-pro", name: "Veo 3.1 Pro", tag: "Pro", desc: "电影级 · 长镜头 · 最佳表现", price: 80 },
        ]}
        defaultModelId="veo-3.1-fast-4k"
        ratios={[
          { id: "916", label: "竖屏 9:16", ratio: "9:16" },
          { id: "169", label: "横屏 16:9", ratio: "16:9" },
          { id: "11", label: "方形 1:1", ratio: "1:1" },
        ]}
        examplePrompts={[
          "3D 粘土动画风格，一只戴蓝色针织帽的小狐狸在雪地里踢雪球，背景是温暖的村庄木屋",
          "电影级航拍镜头，一艘豪华游艇在夕阳下的热带海洋中破浪前行，金色光辉洒在海面",
          "赛博朋克雨夜街头，穿黑色机能外套的少年手握全息平板，霓虹光在湿润地面反射",
        ]}
      />
    </ToolPageShell>
  )
}
