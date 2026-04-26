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
 */
export const MODEL_CONFIG_SCHEMA: Record<ModelType, ModelConfigField[]> = {
  video: [
    {
      key: "ratios",
      label: "支持的画面比例",
      type: "list",
      placeholder: "16:9, 9:16, 1:1",
      description: "用英文逗号分隔，会显示为视频比例选项",
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
      description: "用英文逗号分隔，对应「视频时长」选项",
      defaultValue: "5, 10",
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
      description: "开启后，生成页将显示「图生视频」入口",
      defaultValue: true,
    },
    {
      key: "image_capability",
      label: "图生视频能力",
      type: "select",
      options: [
        { value: "frames", label: "首尾帧 + 多图参考（如 Veo / 可灵）" },
        { value: "single", label: "单图参考（如 Grok）" },
      ],
      defaultValue: "frames",
    },
    {
      key: "multi_image_slots",
      label: "多图参考槽位数",
      type: "number",
      placeholder: "默认 3",
      defaultValue: 3,
    },
    {
      key: "channels",
      label: "可选渠道",
      type: "list",
      placeholder: "官方, 极速, 高品质",
      description: "可选；填写后生成页会显示「选择渠道」",
    },
    {
      key: "max_prompt_length",
      label: "提示词最大字符",
      type: "number",
      defaultValue: 5000,
    },
  ],
  image: [
    {
      key: "ratios",
      label: "支持的画面比例",
      type: "list",
      placeholder: "1:1, 9:16, 16:9, 3:4, 4:3",
      description: "用英文逗号分隔，对应「画面比例」选项",
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
      placeholder: "自动, 写实摄影, 电影感, 赛博朋克, 动漫, 水彩",
      description: "用英文逗号分隔，对应「风格」标签",
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
      description: "用英文逗号分隔，对应「画质」选项的内部值",
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
      defaultValue: 4,
    },
    {
      key: "supports_negative_prompt",
      label: "支持负向提示词",
      type: "boolean",
      description: "开启后，生成页会显示「负向提示词」输入框",
      defaultValue: true,
    },
    {
      key: "supports_reference_image",
      label: "支持参考图",
      type: "boolean",
      description: "开启后，生成页支持上传参考图（如 Nano Banana 模式）",
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
      defaultValue: 2000,
    },
  ],
  music: [
    {
      key: "genres",
      label: "支持的曲风",
      type: "list",
      placeholder: "流行, 电子, 摇滚, 民谣",
      description: "用英文逗号分隔，对应「曲风」标签",
      defaultValue: "流行, 电子, 摇滚, 民谣, 古风, Hip Hop, 爵士, R&B, 放克, Lo-fi",
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
      description: "用英文逗号分隔，对应「情绪」标签",
      defaultValue: "治愈, 热血, 忧伤, 欢快, 浪漫, 神秘, 怀旧, 史诗, 冥想",
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
      description: "可选值：female / male / duet / instrumental，用英文逗号分隔",
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
      description: "开启后，生成页将提供「自定义歌词」模式",
      defaultValue: true,
    },
    {
      key: "tracks_per_generation",
      label: "每次生成数量",
      type: "number",
      placeholder: "默认 2",
      defaultValue: 2,
    },
    {
      key: "max_duration",
      label: "最长时长（秒）",
      type: "number",
      defaultValue: 240,
    },
    {
      key: "max_desc_length",
      label: "描述最大字符",
      type: "number",
      defaultValue: 500,
    },
    {
      key: "max_lyrics_length",
      label: "歌词最大字符",
      type: "number",
      defaultValue: 3000,
    },
  ],
}
