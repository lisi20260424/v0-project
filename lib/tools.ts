import type { LucideIcon } from "lucide-react"
import {
  Video,
  Film,
  Sparkles,
  ImageIcon,
  Banana,
  Music2,
  Wand2,
  Play,
} from "lucide-react"

export type ToolCategory = "video" | "image" | "audio"

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  video: "视频生成",
  image: "图像生成",
  audio: "音乐生成",
}

export type Tool = {
  id: string
  name: string
  brand: string
  desc: string
  href: string
  category: ToolCategory
  /** 图标既支持直接传入的 LucideIcon 组件（mock 数据），
   *  也支持图标名字符串（来自数据库 config.ui_icon）。 */
  icon: LucideIcon | string
  accent: string
  cost: string
  tag?: string
}

export const TOOLS: Tool[] = [
  {
    id: "veo",
    name: "Veo 视频",
    brand: "Google Veo 3.1",
    desc: "文生视频、图生视频，支持 4K 超清与电影级镜头语言。",
    href: "/veo",
    category: "video",
    tag: "4K",
    icon: Video,
    accent: "from-emerald-500/30 to-teal-500/10",
    cost: "30 点起",
  },
  {
    id: "sora",
    name: "Sora 视频",
    brand: "OpenAI Sora 2",
    desc: "高度真实的世界模拟器，支持 10s / 15s 时长，物理一致性强。",
    href: "/sora",
    category: "video",
    tag: "Pro",
    icon: Film,
    accent: "from-sky-500/30 to-indigo-500/10",
    cost: "25 点起",
  },
  {
    id: "kling",
    name: "可灵视频",
    brand: "Kuaishou Kling 2.0",
    desc: "中国团队自研，中文指令理解精准，人物动作自然流畅。",
    href: "/kling",
    category: "video",
    tag: "HOT",
    icon: Sparkles,
    accent: "from-amber-500/30 to-orange-500/10",
    cost: "20 点起",
  },
  {
    id: "grok",
    name: "Grok 视频",
    brand: "xAI Grok Video",
    desc: "单图快速驱动成片，视频尺寸自动跟随参考图，轻量创意首选。",
    href: "/grok",
    category: "video",
    tag: "新",
    icon: Play,
    accent: "from-zinc-500/30 to-slate-500/10",
    cost: "15 点起",
  },
  {
    id: "gpt-image",
    name: "GPT-Image",
    brand: "OpenAI GPT-Image 2",
    desc: "全新一代多模态图像生成，细节丰富，支持精准文字渲染。",
    href: "/image",
    category: "image",
    tag: "新上线",
    icon: ImageIcon,
    accent: "from-violet-500/30 to-fuchsia-500/10",
    cost: "4 点起",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    brand: "Google Nano Banana",
    desc: "交互式图像编辑，支持多图融合、局部重绘、风格迁移。",
    href: "/image?model=nano-banana",
    category: "image",
    icon: Banana,
    accent: "from-yellow-500/30 to-amber-500/10",
    cost: "5 点起",
  },
  {
    id: "flux",
    name: "Flux 图像",
    brand: "Black Forest Labs Flux",
    desc: "开源顶级图像模型，摄影级真实质感，艺术创作首选。",
    href: "/image?model=flux",
    category: "image",
    icon: Wand2,
    accent: "from-rose-500/30 to-pink-500/10",
    cost: "3 点起",
  },
  {
    id: "suno",
    name: "Suno 音乐",
    brand: "Suno V5",
    desc: "输入歌词或描述，生成完整的人声 + 伴奏的高质量歌曲。",
    href: "/suno",
    category: "audio",
    tag: "V5",
    icon: Music2,
    accent: "from-cyan-500/30 to-blue-500/10",
    cost: "8 点起",
  },
]
