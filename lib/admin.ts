type AppMetadataLike = { role?: string | null } | null | undefined
type UserLike = { app_metadata?: AppMetadataLike; role?: string | null } | null | undefined

export function isAdminUser(user: UserLike): boolean {
  const role = user?.role ?? user?.app_metadata?.role
  return typeof role === "string" && role.toLowerCase() === "admin"
}

export const USER_TYPES = ["normal", "admin"] as const
export type UserType = (typeof USER_TYPES)[number]

export const USER_TYPE_LABELS: Record<UserType, string> = {
  normal: "普通用户",
  admin: "管理员",
}

export const USER_STATUSES = ["active", "suspended", "banned"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "正常",
  suspended: "已暂停",
  banned: "已封禁",
}

export const VIP_TIERS = ["monthly", "annual", "lifetime"] as const
export type VipTier = (typeof VIP_TIERS)[number]

export const VIP_TIER_LABELS: Record<VipTier, string> = {
  monthly: "月度会员",
  annual: "年度会员",
  lifetime: "终身会员",
}

export const MODEL_TYPES = ["video", "image", "music"] as const
export type ModelType = (typeof MODEL_TYPES)[number]

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  video: "视频生成",
  image: "图像生成",
  music: "音乐生成",
}

export const BILLING_TYPE_LABELS: Record<string, string> = {
  per_use: "按次计费",
}

export type ModelConfigField = {
  key: string
  label: string
  type: "text" | "select" | "number" | "boolean" | "list"
  options?: { value: string; label: string }[]
  placeholder?: string
  description?: string
  defaultValue?: string | number | boolean
}

export const MODEL_CONFIG_SCHEMA: Record<ModelType, ModelConfigField[]> = {
  video: [
    { key: "api_model_id", label: "API 模型标识", type: "text", placeholder: "例如：sora-video, veo-video", defaultValue: "" },
    { key: "ratios", label: "支持的画面比例", type: "list", placeholder: "16:9, 9:16, 1:1", defaultValue: "16:9, 9:16, 1:1" },
    { key: "default_ratio", label: "默认比例", type: "text", placeholder: "16:9", defaultValue: "16:9" },
    { key: "durations", label: "支持的时长（秒）", type: "list", placeholder: "5, 10", defaultValue: "5, 10" },
    { key: "max_duration", label: "最长可用时长（秒）", type: "number", defaultValue: 60 },
    { key: "max_count", label: "单次最多生成数量", type: "number", defaultValue: 4 },
    { key: "supports_image_to_video", label: "支持图生视频", type: "boolean", defaultValue: true },
    {
      key: "image_capability",
      label: "图生视频能力类型",
      type: "select",
      options: [
        { value: "start_end_frames", label: "首尾帧" },
        { value: "multi_frame", label: "多帧参考" },
        { value: "single_image", label: "单图参考" },
      ],
      defaultValue: "start_end_frames",
    },
    { key: "multi_image_max", label: "参考图最大数量", type: "number", placeholder: "默认 5", defaultValue: 5 },
    { key: "supports_negative_prompt", label: "支持负向提示词", type: "boolean", defaultValue: false },
    { key: "max_prompt_length", label: "提示词最大字符数", type: "number", defaultValue: 5000 },
  ],
  image: [
    { key: "api_model_id", label: "API 模型标识", type: "text", placeholder: "例如：dall-e-3, flux-pro", defaultValue: "" },
    { key: "ratios", label: "支持的画面比例", type: "list", placeholder: "1:1, 9:16, 16:9", defaultValue: "1:1, 9:16, 16:9, 3:4, 4:3" },
    { key: "default_ratio", label: "默认比例", type: "text", placeholder: "1:1", defaultValue: "1:1" },
    { key: "styles", label: "支持的风格", type: "list", placeholder: "自动, 写实摄影, 动漫", defaultValue: "自动, 写实摄影, 电影感, 赛博朋克, 动漫, 水彩, 油画, 3D 渲染, 像素艺术" },
    { key: "default_style", label: "默认风格", type: "text", defaultValue: "自动" },
    { key: "qualities", label: "支持的画质", type: "list", placeholder: "standard, hd, ultra", defaultValue: "standard, hd, ultra" },
    {
      key: "default_quality",
      label: "默认画质",
      type: "select",
      options: [
        { value: "standard", label: "标准" },
        { value: "hd", label: "高清" },
        { value: "ultra", label: "超清 4K" },
      ],
      defaultValue: "hd",
    },
    { key: "max_count", label: "单次最多生成数量", type: "number", defaultValue: 4 },
    { key: "supports_negative_prompt", label: "支持负向提示词", type: "boolean", defaultValue: true },
    { key: "supports_reference_image", label: "支持参考图", type: "boolean", defaultValue: false },
    { key: "max_reference_images", label: "参考图最大数量", type: "number", placeholder: "默认 3", defaultValue: 3 },
    { key: "max_prompt_length", label: "提示词最大字符数", type: "number", defaultValue: 2000 },
  ],
  music: [
    { key: "api_model_id", label: "API 模型标识", type: "text", placeholder: "例如：suno-v5, music-gen", defaultValue: "" },
    { key: "genres", label: "支持的曲风", type: "list", placeholder: "流行, 摇滚, 电子, 民谣", defaultValue: "流行, 摇滚, 电子, 民谣, 古风, Hip-Hop, 爵士, R&B, 放克, Lo-fi, 古典" },
    { key: "default_genre", label: "默认曲风", type: "text", defaultValue: "流行" },
    { key: "moods", label: "支持的情绪", type: "list", placeholder: "治愈, 热血, 忧伤", defaultValue: "治愈, 热血, 忧伤, 欢快, 浪漫, 神秘, 史诗, 冥想, 深沉" },
    { key: "default_mood", label: "默认情绪", type: "text", defaultValue: "治愈" },
    { key: "vocals", label: "支持的人声类型", type: "list", placeholder: "female, male, duet, instrumental", defaultValue: "female, male, duet, instrumental" },
    {
      key: "default_vocal",
      label: "默认人声",
      type: "select",
      options: [
        { value: "female", label: "女声" },
        { value: "male", label: "男声" },
        { value: "duet", label: "男女合唱" },
        { value: "instrumental", label: "纯音乐" },
      ],
      defaultValue: "female",
    },
    { key: "supports_custom_lyrics", label: "支持自定义歌词", type: "boolean", defaultValue: true },
    { key: "tracks_per_generation", label: "每次生成曲目数", type: "number", placeholder: "默认 2", defaultValue: 2 },
    { key: "max_duration", label: "最长时长（秒）", type: "number", defaultValue: 480 },
    { key: "max_prompt_length", label: "提示词最大字符数", type: "number", defaultValue: 5000 },
  ],
}
