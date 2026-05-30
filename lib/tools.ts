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
  icon: string
  accent: string
  cost: string
  tag?: string
}

export const TOOLS: Tool[] = [
  {
    id: "veo",
    name: "Veo 视频",
    brand: "Google Veo 3.1",
    desc: "文生视频、图生视频，支持高清画面和电影级镜头语言。",
    href: "/video?provider=google",
    category: "video",
    tag: "4K",
    icon: "Video",
    accent: "from-emerald-500/30 to-teal-500/10",
    cost: "30 点起",
  },
  {
    id: "sora",
    name: "Sora 视频",
    brand: "OpenAI Sora",
    desc: "高质量文本到视频生成，适合创意短片和广告分镜。",
    href: "/video?provider=openai",
    category: "video",
    tag: "Pro",
    icon: "Film",
    accent: "from-sky-500/30 to-indigo-500/10",
    cost: "25 点起",
  },
  {
    id: "kling",
    name: "可灵视频",
    brand: "Kling",
    desc: "中文提示词理解自然，适合人物动作和镜头运动生成。",
    href: "/video?provider=kling",
    category: "video",
    tag: "HOT",
    icon: "Sparkles",
    accent: "from-amber-500/30 to-orange-500/10",
    cost: "20 点起",
  },
  {
    id: "grok",
    name: "Grok 视频",
    brand: "xAI Grok Video",
    desc: "单图快速驱动成片，适合轻量创意和社媒短内容。",
    href: "/video?provider=grok",
    category: "video",
    tag: "新",
    icon: "Play",
    accent: "from-zinc-500/30 to-slate-500/10",
    cost: "15 点起",
  },
  {
    id: "gpt-image",
    name: "GPT-Image",
    brand: "OpenAI GPT-Image",
    desc: "通用图像生成，适合产品图、海报和概念设计。",
    href: "/image?provider=openai",
    category: "image",
    tag: "新上线",
    icon: "ImageIcon",
    accent: "from-violet-500/30 to-fuchsia-500/10",
    cost: "4 点起",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    brand: "Google Image",
    desc: "交互式图像编辑，支持多图融合、局部重绘和风格迁移。",
    href: "/image?provider=google",
    category: "image",
    icon: "Banana",
    accent: "from-yellow-500/30 to-amber-500/10",
    cost: "5 点起",
  },
  {
    id: "flux",
    name: "Flux 图像",
    brand: "Black Forest Labs Flux",
    desc: "高质量图像模型，适合摄影质感和艺术创作。",
    href: "/image?provider=flux",
    category: "image",
    icon: "Wand2",
    accent: "from-rose-500/30 to-pink-500/10",
    cost: "3 点起",
  },
  {
    id: "suno",
    name: "Suno 音乐",
    brand: "Suno V5",
    desc: "输入歌词或描述，生成带人声与伴奏的完整歌曲。",
    href: "/music?provider=suno",
    category: "audio",
    tag: "V5",
    icon: "Music2",
    accent: "from-cyan-500/30 to-blue-500/10",
    cost: "8 点起",
  },
]
