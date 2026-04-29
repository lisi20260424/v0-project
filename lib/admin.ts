/**
 * 管理员配置工具：通过环境变量 ADMIN_EMAILS 配置管理员邮箱白名单
 *
 * 配置示例（.env.local）：
 *   ADMIN_EMAILS=admin@example.com,owner@example.com
 *
 * 命中白名单的已登录用户将获得管理员权限。
 */

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? ""
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  return getAdminEmails().includes(normalized)
}

/**
 * 用户管理相关常量
 */
export const USER_TYPES = ["normal", "internal", "enterprise", "admin"] as const
export type UserType = (typeof USER_TYPES)[number]

export const USER_TYPE_LABELS: Record<UserType, string> = {
  normal: "普通用户",
  internal: "内部用户",
  enterprise: "企业用户",
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

export const VIP_TIER_LABELS: Record<VipTier | "free", string> = {
  free: "免费用户",
  monthly: "月度会员",
  annual: "年度会员",
  lifetime: "终身会员",
}

/**
 * 模型类型常量与显示名映射
 */
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

/**
 * 不同模型类型的可配置项 schema（用于动态表单渲染）
 *
 * 字段类型说明：
 *  - text:    单行文本
 *  - number:  数字输入
 *  - select:  下拉单选
 *  - boolean: 开关（Switch）
 *  - list:    多值列表（用英文逗号分隔输入，存储为字符串）
 */
export type ModelConfigField = {
  key: string
  label: string
  type: "text" | "select" | "number" | "boolean" | "list"
  options?: { value: string; label: string }[]
  placeholder?: string
  description?: string
  defaultValue?: string | number | boolean
}

/**
 * 配置项与三个生成器组件中的能力参数一一对应：
 *  - video:  components/video-generator.tsx 的 props（ratios / durations / counts / supportsImageToVideo / imageCapability ...）
 *  - image:  components/image-generator.tsx 的 RATIOS / STYLES / QUALITIES / 数量 / 是否支持参考图与负向提示词
 *  - music:  components/music-generator.tsx 的 GENRES / MOODS / VOCALS / 是否支持自定义歌词等
 *
 * 参数选择基于市面主流模型研究（2025-2026）：
 *  - 视频生成：Sora 2 / Veo 3.1 / Runway Gen-4.5 / Kling 2.6
 *  - 图像生成：DALL-E 3 / Midjourney / Stable Diffusion
 *  - 音乐生成：Suno v5 / MusicLM / Stable Audio
 */
export const MODEL_CONFIG_SCHEMA: Record<ModelType, ModelConfigField[]> = {
  video: [
    {
      key: "api_model_id",
      label: "API 模型标识",
      type: "text",
      placeholder: "例如：gpt-4o-video, dall-e-3",
      description: "New API 网关中对应的模型 ID，用于调用生成接口。可在网关管理后台查看可用模型列表",
      defaultValue: "",
    },
    {
      key: "ratios",
      label: "支持的画面比例",
      type: "list",
      placeholder: "16:9, 9:16, 1:1",
      description: "用英文逗号分隔，显示在「画面比例」下拉选项中",
      defaultValue: "16:9, 9:16, 1:1",
    },
    {
      key: "default_ratio",
      label: "默认比例",
      type: "text",
      placeholder: "16:9",
      defaultValue: "16:9",
    },
    {
      key: "durations",
      label: "支持的时长（秒）",
      type: "list",
      placeholder: "5, 10",
      description: "用英文逗号分隔，显示在「视频时长」选项中。市面模型通常支持 5-60 秒范围",
      defaultValue: "5, 10",
    },
    {
      key: "max_duration",
      label: "最长可用时长（秒）",
      type: "number",
      description: "生成页中的滑块上限",
      defaultValue: 60,
    },
    {
      key: "max_count",
      label: "单次最多生成数量",
      type: "number",
      defaultValue: 4,
    },
    {
      key: "supports_image_to_video",
      label: "支持图生视频",
      type: "boolean",
      description: "如 Sora 2、Veo、可灵等支持首帧/末帧参考",
      defaultValue: true,
    },
    {
      key: "image_capability",
      label: "图生视频能力类型",
      type: "select",
      options: [
        { value: "start_end_frames", label: "首尾帧（Sora 2 / Veo / Kling）" },
        { value: "multi_frame", label: "多帧参考（5-10 帧）" },
        { value: "single_image", label: "单图参考（Runway）" },
      ],
      description: "决定图生视频页显示的上传组件",
      defaultValue: "start_end_frames",
    },
    {
      key: "multi_image_max",
      label: "多帧参考最大数量",
      type: "number",
      placeholder: "默认 5",
      defaultValue: 5,
    },
    {
      key: "supports_negative_prompt",
      label: "支持负向提示词",
      type: "boolean",
      defaultValue: false,
    },
    {
      key: "max_prompt_length",
      label: "提示词最大字符",
      type: "number",
      description: "Sora 2 为 5000，Veo 3.1 为 1000",
      defaultValue: 5000,
    },
  ],
  image: [
    {
      key: "api_model_id",
      label: "API 模型标识",
      type: "text",
      placeholder: "例如：dall-e-3, flux-pro",
      description: "New API 网关中对应的模型 ID，用于调用生成接口。可在网关管理后台查看可用模型列表",
      defaultValue: "",
    },
    {
      key: "ratios",
      label: "支持的画面比例",
      type: "list",
      placeholder: "1:1, 9:16, 16:9, 3:4, 4:3",
      description: "用英文逗号分隔。DALL-E 3 支持 1:1/16:9/9:16，Midjourney 支持更多",
      defaultValue: "1:1, 9:16, 16:9, 3:4, 4:3",
    },
    {
      key: "default_ratio",
      label: "默认比例",
      type: "text",
      placeholder: "1:1",
      defaultValue: "1:1",
    },
    {
      key: "styles",
      label: "支持的风格",
      type: "list",
      placeholder: "自动, 写实摄影, 赛博朋克, 动漫",
      description: "Midjourney 推荐值：摄影、3D 渲染、电影感、水彩、油画、赛博朋克、极简、动漫等",
      defaultValue: "自动, 写实摄影, 电影感, 赛博朋克, 动漫, 水彩, 油画, 3D 渲染, 像素艺术",
    },
    {
      key: "default_style",
      label: "默认风格",
      type: "text",
      defaultValue: "自动",
    },
    {
      key: "qualities",
      label: "支持的画质",
      type: "list",
      placeholder: "standard, hd, ultra",
      description: "Midjourney: --quality 0.25/0.5/1/2，DALL-E: hd/standard，Stable Diffusion: steps(20-150)",
      defaultValue: "standard, hd, ultra",
    },
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
    {
      key: "max_count",
      label: "单次最多生成数量",
      type: "number",
      description: "DALL-E 3 为 1，Midjourney 支持多张，Stable Diffusion 支持 1-8",
      defaultValue: 4,
    },
    {
      key: "supports_negative_prompt",
      label: "支持负向提示词",
      type: "boolean",
      description: "Stable Diffusion 支持，DALL-E 3 不支持",
      defaultValue: true,
    },
    {
      key: "supports_reference_image",
      label: "支持参考图",
      type: "boolean",
      description: "Stable Diffusion 支持 ControlNet，DALL-E 支持 Variations",
      defaultValue: false,
    },
    {
      key: "max_reference_images",
      label: "参考图最大数量",
      type: "number",
      placeholder: "默认 3",
      defaultValue: 3,
    },
    {
      key: "max_prompt_length",
      label: "提示词最大字符",
      type: "number",
      description: "DALL-E 3 为 2000，Midjourney 为 2000，Stable Diffusion 为 2000",
      defaultValue: 2000,
    },
  ],
  music: [
    {
      key: "api_model_id",
      label: "API 模型标识",
      type: "text",
      placeholder: "例如：suno-v5, music-gen",
      description: "New API 网关中对应的模型 ID，用于调用生成接口。可在网关管理后台查看可用模型列表",
      defaultValue: "",
    },
    {
      key: "genres",
      label: "支持的曲风",
      type: "list",
      placeholder: "流行, 摇滚, 电子, 民谣",
      description: "Suno 官方支持 150+ 曲风。推荐：流行/摇滚/电子/民谣/古风/Hip-Hop/爵士/R&B/放克/Lo-fi/古典等",
      defaultValue: "流行, 摇滚, 电子, 民谣, 古风, Hip-Hop, 爵士, R&B, 放克, Lo-fi, 古典, 环境音乐, 怀旧, 金属",
    },
    {
      key: "default_genre",
      label: "默认曲风",
      type: "text",
      defaultValue: "流行",
    },
    {
      key: "moods",
      label: "支持的情绪",
      type: "list",
      placeholder: "治愈, 热血, 忧伤",
      description: "常见情绪：治愈/热血/忧伤/欢快/浪漫/神秘/怀旧/史诗/冥想/深沉/诡异等",
      defaultValue: "治愈, 热血, 忧伤, 欢快, 浪漫, 神秘, 怀旧, 史诗, 冥想, 深沉, 诡异, 宁静, 紧张",
    },
    {
      key: "default_mood",
      label: "默认情绪",
      type: "text",
      defaultValue: "治愈",
    },
    {
      key: "vocals",
      label: "支持的人声类型",
      type: "list",
      placeholder: "female, male, duet, instrumental",
      description: "值：female(女声) / male(男声) / duet(男女合唱) / instrumental(纯音乐)",
      defaultValue: "female, male, duet, instrumental",
    },
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
    {
      key: "supports_custom_lyrics",
      label: "支持自定义歌词",
      type: "boolean",
      description: "Suno 的 customMode。开启后用户可输入精确歌词",
      defaultValue: true,
    },
    {
      key: "tracks_per_generation",
      label: "每次生成曲目数",
      type: "number",
      placeholder: "默认 2",
      description: "Suno 标准为 2 首。V5 支持高达 8 分钟或多首",
      defaultValue: 2,
    },
    {
      key: "max_duration",
      label: "最长时长（秒）",
      type: "number",
      description: "Suno V5 支持最长 8 分钟 (480 秒)，V4 为 4 分钟 (240 秒)",
      defaultValue: 480,
    },
    {
      key: "max_prompt_length",
      label: "提示词最大字符",
      type: "number",
      description: "Suno v5 为 5000 字符",
      defaultValue: 5000,
    },
  ],
}
