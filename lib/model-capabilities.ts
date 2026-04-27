/**
 * 把 admin_models.config 字段解析为 generator 组件能直接消费的能力对象。
 *
 * config 的字段定义见 lib/admin.ts 中的 MODEL_CONFIG_SCHEMA。
 */

export type Ratio = { id: string; label: string; ratio: string; w?: number; h?: number }
export type LabeledOption = { id: string; label: string }

/** 视频模型能力 */
export type VideoCapabilities = {
  ratios: Ratio[]
  durations: LabeledOption[]
  counts: number[]
  maxPromptLength: number
  supportsImageToVideo: boolean
  imageCapability: "frames" | "single"
  multiImageSlots: number
  supportsNegativePrompt: boolean
}

/** 图像模型能力 */
export type ImageCapabilities = {
  ratios: Ratio[]
  styles: string[]
  qualities: LabeledOption[]
  counts: number[]
  maxPromptLength: number
  supportsNegativePrompt: boolean
  supportsReferenceImage: boolean
  maxReferenceImages: number
}

/** 音乐模型能力 */
export type MusicCapabilities = {
  genres: string[]
  moods: string[]
  vocals: LabeledOption[]
  supportsCustomLyrics: boolean
  tracksPerGeneration: number
  maxDescLength: number
  maxLyricsLength: number
}

function parseList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean)
  if (typeof input === "string") {
    return input
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function parseNumber(input: unknown, fallback: number): number {
  const n = typeof input === "number" ? input : Number.parseFloat(String(input ?? ""))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function parseBool(input: unknown, fallback: boolean): boolean {
  if (typeof input === "boolean") return input
  if (input === "true") return true
  if (input === "false") return false
  return fallback
}

/** 把 "16:9" 转为 ratio 对象，自动生成 id（去掉冒号）和 w/h */
function ratioFromString(value: string): Ratio | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parts = trimmed.split(":")
  let w = 1
  let h = 1
  if (parts.length === 2) {
    w = Number.parseFloat(parts[0])
    h = Number.parseFloat(parts[1])
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      w = 1
      h = 1
    }
  }
  return {
    id: trimmed.replace(/[^0-9a-zA-Z]/g, "") || trimmed,
    label: trimmed,
    ratio: trimmed,
    w,
    h,
  }
}

/** 把 "5" / "5 秒" 转为 duration 选项 */
function durationFromString(value: string): LabeledOption | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  // 如果是纯数字就给加上单位
  const isPureNumber = /^\d+$/.test(trimmed)
  return {
    id: trimmed,
    label: isPureNumber ? `${trimmed} 秒` : trimmed,
  }
}

const VOCAL_LABEL: Record<string, string> = {
  female: "女声",
  male: "男声",
  duet: "男女合唱",
  instrumental: "纯音乐",
}

function buildCounts(maxCount: number): number[] {
  const safe = Math.max(1, Math.floor(maxCount))
  if (safe >= 4) return [1, 2, 3, 4]
  return Array.from({ length: safe }, (_, i) => i + 1)
}

/** 解析视频模型能力 */
export function parseVideoCapabilities(config: Record<string, any> | null | undefined): VideoCapabilities {
  const c = config ?? {}
  const ratios = parseList(c.ratios).map(ratioFromString).filter((x): x is Ratio => !!x)
  const durations = parseList(c.durations).map(durationFromString).filter((x): x is LabeledOption => !!x)
  const maxCount = parseNumber(c.max_count, 4)
  const imageCap = String(c.image_capability ?? "start_end_frames")
  const imageCapability: "frames" | "single" = imageCap === "single_image" ? "single" : "frames"

  return {
    ratios: ratios.length ? ratios : [
      { id: "169", label: "16:9", ratio: "16:9", w: 16, h: 9 },
      { id: "916", label: "9:16", ratio: "9:16", w: 9, h: 16 },
      { id: "11", label: "1:1", ratio: "1:1", w: 1, h: 1 },
    ],
    durations: durations.length ? durations : [
      { id: "5", label: "5 秒" },
      { id: "10", label: "10 秒" },
    ],
    counts: buildCounts(maxCount),
    maxPromptLength: parseNumber(c.max_prompt_length, 5000),
    supportsImageToVideo: parseBool(c.supports_image_to_video, true),
    imageCapability,
    multiImageSlots: parseNumber(c.multi_image_max, 5),
    supportsNegativePrompt: parseBool(c.supports_negative_prompt, false),
  }
}

/** 解析图像模型能力 */
export function parseImageCapabilities(config: Record<string, any> | null | undefined): ImageCapabilities {
  const c = config ?? {}
  const ratios = parseList(c.ratios).map(ratioFromString).filter((x): x is Ratio => !!x)
  const styles = parseList(c.styles)
  const qualityIds = parseList(c.qualities)
  const qualityMap: Record<string, string> = {
    standard: "标准",
    hd: "高清",
    ultra: "超清 4K",
  }
  const qualities: LabeledOption[] = qualityIds.length
    ? qualityIds.map((id) => ({ id, label: qualityMap[id] ?? id }))
    : [
        { id: "standard", label: "标准" },
        { id: "hd", label: "高清" },
        { id: "ultra", label: "超清 4K" },
      ]
  const maxCount = parseNumber(c.max_count, 4)
  return {
    ratios: ratios.length ? ratios : [
      { id: "11", label: "1:1", ratio: "1:1", w: 1, h: 1 },
      { id: "916", label: "9:16", ratio: "9:16", w: 9, h: 16 },
      { id: "169", label: "16:9", ratio: "16:9", w: 16, h: 9 },
      { id: "34", label: "3:4", ratio: "3:4", w: 3, h: 4 },
      { id: "43", label: "4:3", ratio: "4:3", w: 4, h: 3 },
    ],
    styles: styles.length ? styles : ["自动", "写实摄影", "电影感", "赛博朋克", "动漫", "水彩", "油画", "3D 渲染"],
    qualities,
    counts: buildCounts(maxCount),
    maxPromptLength: parseNumber(c.max_prompt_length, 2000),
    supportsNegativePrompt: parseBool(c.supports_negative_prompt, true),
    supportsReferenceImage: parseBool(c.supports_reference_image, false),
    maxReferenceImages: parseNumber(c.max_reference_images, 3),
  }
}

/** 解析音乐模型能力 */
export function parseMusicCapabilities(config: Record<string, any> | null | undefined): MusicCapabilities {
  const c = config ?? {}
  const genres = parseList(c.genres)
  const moods = parseList(c.moods)
  const vocalIds = parseList(c.vocals)
  const vocals: LabeledOption[] = (vocalIds.length
    ? vocalIds
    : ["female", "male", "duet", "instrumental"]
  ).map((id) => ({ id, label: VOCAL_LABEL[id] ?? id }))
  return {
    genres: genres.length ? genres : ["流行", "电子", "摇滚", "民谣", "古风", "Hip Hop", "爵士"],
    moods: moods.length ? moods : ["治愈", "热血", "忧伤", "欢快", "浪漫", "神秘", "怀旧"],
    vocals,
    supportsCustomLyrics: parseBool(c.supports_custom_lyrics, true),
    tracksPerGeneration: parseNumber(c.tracks_per_generation, 2),
    maxDescLength: parseNumber(c.max_desc_length, 500),
    maxLyricsLength: parseNumber(c.max_lyrics_length, 5000),
  }
}
