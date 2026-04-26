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
  Mic2,
  AudioWaveform,
  Camera,
  Palette,
  Zap,
} from "lucide-react"

/**
 * 图标字符串名 -> LucideIcon 组件 映射。
 *
 * 这个映射主要用来支持把 admin_models.config 中存储的图标字符串
 * （如 "Video"、"Film"）解析为可以渲染的 React 组件。
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  Video,
  Film,
  Sparkles,
  ImageIcon,
  Banana,
  Music2,
  Wand2,
  Play,
  Mic2,
  AudioWaveform,
  Camera,
  Palette,
  Zap,
}

/**
 * 可在管理后台下拉菜单中选择的图标列表（按显示顺序）。
 */
export const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "Video", label: "视频 Video" },
  { value: "Film", label: "胶片 Film" },
  { value: "Play", label: "播放 Play" },
  { value: "Camera", label: "相机 Camera" },
  { value: "ImageIcon", label: "图片 Image" },
  { value: "Banana", label: "香蕉 Banana" },
  { value: "Wand2", label: "魔法棒 Wand" },
  { value: "Palette", label: "调色板 Palette" },
  { value: "Sparkles", label: "闪光 Sparkles" },
  { value: "Music2", label: "音乐 Music" },
  { value: "Mic2", label: "麦克风 Mic" },
  { value: "AudioWaveform", label: "音波 Waveform" },
  { value: "Zap", label: "闪电 Zap" },
]

/**
 * 根据 model_type 获取默认图标名。
 */
export function defaultIconNameForType(modelType: string): string {
  switch (modelType) {
    case "video":
      return "Video"
    case "image":
      return "ImageIcon"
    case "music":
      return "Music2"
    default:
      return "Sparkles"
  }
}

/**
 * 根据 model_type 获取默认渐变色。
 */
export function defaultAccentForType(modelType: string): string {
  switch (modelType) {
    case "video":
      return "from-sky-500/30 to-indigo-500/10"
    case "image":
      return "from-violet-500/30 to-fuchsia-500/10"
    case "music":
      return "from-cyan-500/30 to-blue-500/10"
    default:
      return "from-primary/30 to-accent/10"
  }
}

/**
 * 解析图标：传入 LucideIcon 组件、字符串名、或 undefined，返回一个可渲染的 LucideIcon。
 */
export function resolveIcon(input: LucideIcon | string | undefined | null, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!input) return fallback
  if (typeof input === "string") return ICON_MAP[input] || fallback
  return input
}

/**
 * 可在管理后台下拉菜单中选择的渐变色列表。
 */
export const ACCENT_OPTIONS: { value: string; label: string }[] = [
  { value: "from-sky-500/30 to-indigo-500/10", label: "天空蓝 → 靛蓝" },
  { value: "from-emerald-500/30 to-teal-500/10", label: "翡翠绿 → 蓝绿" },
  { value: "from-amber-500/30 to-orange-500/10", label: "琥珀黄 → 橙色" },
  { value: "from-rose-500/30 to-pink-500/10", label: "玫瑰红 → 粉色" },
  { value: "from-violet-500/30 to-fuchsia-500/10", label: "紫罗兰 → 紫红" },
  { value: "from-cyan-500/30 to-blue-500/10", label: "青色 → 蓝色" },
  { value: "from-yellow-500/30 to-amber-500/10", label: "黄色 → 琥珀" },
  { value: "from-zinc-500/30 to-slate-500/10", label: "灰色 → 石板" },
  { value: "from-primary/30 to-accent/10", label: "主题色（默认）" },
]
