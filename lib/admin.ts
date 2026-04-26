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
 */
export type ModelConfigField = {
  key: string
  label: string
  type: "text" | "select" | "number"
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: string | number
}

export const MODEL_CONFIG_SCHEMA: Record<ModelType, ModelConfigField[]> = {
  video: [
    {
      key: "resolution",
      label: "分辨率",
      type: "select",
      options: [
        { value: "480p", label: "480P" },
        { value: "720p", label: "720P" },
        { value: "1080p", label: "1080P" },
        { value: "4k", label: "4K" },
      ],
      defaultValue: "1080p",
    },
    {
      key: "aspect_ratio",
      label: "画面比例",
      type: "select",
      options: [
        { value: "16:9", label: "16:9 横屏" },
        { value: "9:16", label: "9:16 竖屏" },
        { value: "1:1", label: "1:1 方形" },
      ],
      defaultValue: "16:9",
    },
    {
      key: "duration",
      label: "默认时长（秒）",
      type: "number",
      defaultValue: 5,
    },
    {
      key: "fps",
      label: "帧率",
      type: "select",
      options: [
        { value: "24", label: "24 FPS" },
        { value: "30", label: "30 FPS" },
        { value: "60", label: "60 FPS" },
      ],
      defaultValue: "30",
    },
  ],
  image: [
    {
      key: "resolution",
      label: "分辨率",
      type: "select",
      options: [
        { value: "512", label: "512x512" },
        { value: "1024", label: "1024x1024" },
        { value: "2048", label: "2048x2048" },
      ],
      defaultValue: "1024",
    },
    {
      key: "aspect_ratio",
      label: "画面比例",
      type: "select",
      options: [
        { value: "1:1", label: "1:1 方形" },
        { value: "16:9", label: "16:9 横屏" },
        { value: "9:16", label: "9:16 竖屏" },
        { value: "4:3", label: "4:3" },
        { value: "3:4", label: "3:4" },
      ],
      defaultValue: "1:1",
    },
    {
      key: "quality",
      label: "画质",
      type: "select",
      options: [
        { value: "standard", label: "标准" },
        { value: "hd", label: "高清" },
        { value: "ultra", label: "极致" },
      ],
      defaultValue: "hd",
    },
    {
      key: "style",
      label: "默认风格",
      type: "text",
      placeholder: "如：写实 / 动漫 / 油画",
    },
  ],
  music: [
    {
      key: "duration",
      label: "默认时长（秒）",
      type: "number",
      defaultValue: 30,
    },
    {
      key: "format",
      label: "音频格式",
      type: "select",
      options: [
        { value: "mp3", label: "MP3" },
        { value: "wav", label: "WAV" },
        { value: "flac", label: "FLAC" },
      ],
      defaultValue: "mp3",
    },
    {
      key: "bitrate",
      label: "码率",
      type: "select",
      options: [
        { value: "128", label: "128 kbps" },
        { value: "192", label: "192 kbps" },
        { value: "320", label: "320 kbps" },
      ],
      defaultValue: "192",
    },
    {
      key: "genre",
      label: "默认风格",
      type: "text",
      placeholder: "如：流行 / 古典 / 电子",
    },
  ],
}
