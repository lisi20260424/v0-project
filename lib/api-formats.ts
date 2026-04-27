/**
 * 多种 API 请求/响应格式适配器
 *
 * 支持的格式：
 * - 图片：openai / gemini / qwen-openai
 * - 视频：openai / jimeng / kling / sora
 * - 音乐：openai / gemini
 */

export type GenerationType = "image" | "video" | "music"

export type ImageFormat = "openai" | "gemini" | "qwen-openai"
export type VideoFormat = "openai" | "jimeng" | "kling" | "sora"
export type MusicFormat = "openai" | "gemini"
export type AnyFormat = ImageFormat | VideoFormat | MusicFormat

export type EndpointConfig = {
  path: string
  format: AnyFormat
  // 视频异步任务的查询路径模板，可包含 {taskId} 占位符
  pollPath?: string
  // Sora 特有：获取视频内容的 API 路径模板，可包含 {taskId} 占位符
  contentPath?: string
}

/** 默认端点（未配置时回退） */
export const DEFAULT_ENDPOINTS: Record<GenerationType, EndpointConfig> = {
  image: { path: "/v1/images/generations", format: "openai" },
  video: { path: "/v1/video/generations", format: "openai" },
  music: { path: "/v1/audio/speech", format: "openai" },
}

export type ImageRequestParams = {
  prompt: string
  modelId: string
  size?: string
  n?: number
  quality?: string
  style?: string
  responseFormat?: string
  negative?: string
}

export type VideoRequestParams = {
  prompt: string
  modelId: string
  duration?: number
  width?: number
  height?: number
  fps?: number
  size?: string
  ratio?: string
  n?: number
  seed?: number
  negative?: string
}

export type MusicRequestParams = {
  prompt: string
  modelId: string
  voice?: string
  responseFormat?: string
  speed?: number
  duration?: number
}

export type AnyRequestParams = ImageRequestParams | VideoRequestParams | MusicRequestParams

/** 解析后的统一响应：要么同步拿到 URL，要么是异步任务 */
export type ParsedResponse =
  | { kind: "sync"; urls: string[]; raw: unknown }
  | { kind: "async"; providerTaskId: string; raw: unknown }
  | { kind: "binary"; binary: true; raw: unknown }

/** 视频任务轮询结果 */
export type PollResult =
  | { status: "running"; progress?: number; raw: unknown }
  | { status: "success"; urls: string[]; raw: unknown }
  | { status: "failed"; error: string; raw: unknown }

/* ------------------------------------------------------------------------- */
/* 请求体构造                                                                  */
/* ------------------------------------------------------------------------- */

export function buildRequestBody(
  type: GenerationType,
  format: AnyFormat,
  params: AnyRequestParams,
): { body: Record<string, any>; headers?: Record<string, string> } {
  if (type === "image") return buildImageBody(format as ImageFormat, params as ImageRequestParams)
  if (type === "video") return buildVideoBody(format as VideoFormat, params as VideoRequestParams)
  return buildMusicBody(format as MusicFormat, params as MusicRequestParams)
}

function buildImageBody(format: ImageFormat, p: ImageRequestParams) {
  const { prompt, modelId, size = "1024x1024", n = 1, quality, style, responseFormat = "url", negative } = p

  if (format === "gemini") {
    // 原生 Gemini 格式：generateContent + image generation config
    return {
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: parseGeminiAspect(size),
          },
        },
      },
    }
  }

  if (format === "qwen-openai") {
    // 通义千问 OpenAI 兼容格式（DashScope）：保留 OpenAI 字段，附加 negative_prompt / seed
    const body: Record<string, any> = {
      model: modelId,
      prompt,
      n,
      size,
      response_format: responseFormat,
    }
    if (negative) body.negative_prompt = negative
    if (quality) body.quality = quality
    return { body }
  }

  // 默认 OpenAI
  const body: Record<string, any> = {
    model: modelId,
    prompt,
    n,
    size,
    response_format: responseFormat,
  }
  if (quality) body.quality = quality
  if (style) body.style = style
  return { body }
}

function buildVideoBody(format: VideoFormat, p: VideoRequestParams) {
  const {
    prompt,
    modelId,
    duration = 5,
    width = 1280,
    height = 720,
    fps = 24,
    size,
    ratio,
    n = 1,
    seed,
    negative,
  } = p

  const sizeStr = size ?? `${width}x${height}`
  const ratioStr = ratio ?? deriveRatio(width, height)

  if (format === "sora") {
    // Sora 异步任务：POST /v1/videos
    // Sora 需要 size 参数格式为 "WIDTHxHEIGHT"，如 "1920x1080"
    // duration 需要是字符串
    return {
      body: {
        model: modelId,
        prompt,
        size: sizeStr,
        duration: String(duration),
      },
    }
  }

  if (format === "kling") {
    // 可灵：POST /kling/v1/videos/text2video
    // duration 是整数（秒）
    const body: Record<string, any> = {
      model_name: modelId,
      prompt,
      duration,
      aspect_ratio: ratioStr,
    }
    if (negative) body.negative_prompt = negative
    return { body }
  }

  if (format === "jimeng") {
    // 即梦（字节跳动）：POST /jimeng/...，使用 req_key + 自定义参数
    // duration 是整数（秒）
    const body: Record<string, any> = {
      req_key: modelId,
      prompt,
      width,
      height,
      duration,
    }
    if (seed !== undefined) body.seed = seed
    return { body }
  }

  // 默认 OpenAI 风格
  // duration 是整数（秒）
  const body: Record<string, any> = {
    model: modelId,
    prompt,
    duration,
    width,
    height,
    fps,
    n,
  }
  if (seed !== undefined) body.seed = seed
  return { body }
}

function buildMusicBody(format: MusicFormat, p: MusicRequestParams) {
  const { prompt, modelId, voice = "alloy", responseFormat = "mp3", speed = 1 } = p

  if (format === "gemini") {
    // 原生 Gemini 格式：generateContent + 语音合成
    return {
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      },
    }
  }

  // 默认 OpenAI TTS：/v1/audio/speech
  return {
    body: {
      model: modelId,
      input: prompt.slice(0, 4096),
      voice,
      response_format: responseFormat,
      speed,
    },
  }
}

/* ------------------------------------------------------------------------- */
/* 响应解析                                                                    */
/* ------------------------------------------------------------------------- */

export async function parseResponse(
  type: GenerationType,
  format: AnyFormat,
  response: Response,
): Promise<ParsedResponse> {
  // 二进制响应（如 OpenAI TTS 直接返回 audio）—— 当前实现仅支持上游返回 URL/JSON
  const contentType = response.headers.get("content-type") || ""

  if (contentType.startsWith("audio/") || contentType.startsWith("video/") || contentType.startsWith("image/")) {
    // 二进制无法直接保存为 URL，标记为不支持的同步二进制
    return { kind: "binary", binary: true, raw: { contentType } }
  }

  const text = await response.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`无法解析上游响应：${text.slice(0, 200)}`)
  }

  if (type === "image") return parseImageResponse(format as ImageFormat, json)
  if (type === "video") return parseVideoResponse(format as VideoFormat, json)
  return parseMusicResponse(format as MusicFormat, json)
}

function parseImageResponse(format: ImageFormat, json: any): ParsedResponse {
  if (format === "gemini") {
    // Gemini: candidates[0].content.parts[].inline_data.data 或 file_data.file_uri
    const urls: string[] = []
    const candidates = json?.candidates ?? []
    for (const c of candidates) {
      for (const part of c?.content?.parts ?? []) {
        if (part?.file_data?.file_uri) urls.push(part.file_data.file_uri)
        else if (part?.inline_data?.data) {
          const mime = part.inline_data.mime_type || "image/png"
          urls.push(`data:${mime};base64,${part.inline_data.data}`)
        }
      }
    }
    if (urls.length === 0) throw new Error("Gemini 响应未包含图片数据")
    return { kind: "sync", urls, raw: json }
  }

  // OpenAI / Qwen-OpenAI：data[].url 或 data[].b64_json
  const data = Array.isArray(json?.data) ? json.data : []
  const urls: string[] = []
  for (const item of data) {
    if (typeof item?.url === "string") urls.push(item.url)
    else if (typeof item?.b64_json === "string") urls.push(`data:image/png;base64,${item.b64_json}`)
  }
  if (urls.length === 0) {
    if (json?.error) throw new Error(json.error.message || "图片生成失败")
    throw new Error("响应未包含图片数据")
  }
  return { kind: "sync", urls, raw: json }
}

function parseVideoResponse(format: VideoFormat, json: any): ParsedResponse {
  if (format === "sora") {
    // Sora：{ id, status }，需要异步轮询
    if (json?.id) {
      // 已完成的同步响应（少见）
      const url = sorContentUrl(json)
      if (json?.status === "completed" && url) return { kind: "sync", urls: [url], raw: json }
      return { kind: "async", providerTaskId: String(json.id), raw: json }
    }
    if (json?.error) throw new Error(json.error.message || "Sora 任务创建失败")
    throw new Error("Sora 响应缺少任务 ID")
  }

  if (format === "kling") {
    // 可灵：{ data: { task_id, task_status } }
    const taskId = json?.data?.task_id ?? json?.task_id
    if (taskId) return { kind: "async", providerTaskId: String(taskId), raw: json }
    throw new Error("可灵响应缺少 task_id")
  }

  if (format === "jimeng") {
    // 即梦：{ data: { task_id } } 或 { task_id }
    const taskId = json?.data?.task_id ?? json?.task_id
    if (taskId) return { kind: "async", providerTaskId: String(taskId), raw: json }
    throw new Error("即梦响应缺少 task_id")
  }

  // 默认 OpenAI 视频：可能同步返回 data[].url，也可能异步 { id }
  if (Array.isArray(json?.data) && json.data.length > 0 && json.data[0].url) {
    const urls = json.data.map((d: any) => d.url).filter(Boolean)
    return { kind: "sync", urls, raw: json }
  }
  if (json?.id) return { kind: "async", providerTaskId: String(json.id), raw: json }
  if (json?.task_id) return { kind: "async", providerTaskId: String(json.task_id), raw: json }
  throw new Error("视频生成响应格式无法识别")
}

function parseMusicResponse(format: MusicFormat, json: any): ParsedResponse {
  if (format === "gemini") {
    // Gemini 音频：candidates[0].content.parts[].inline_data
    const urls: string[] = []
    for (const c of json?.candidates ?? []) {
      for (const part of c?.content?.parts ?? []) {
        if (part?.file_data?.file_uri) urls.push(part.file_data.file_uri)
        else if (part?.inline_data?.data) {
          const mime = part.inline_data.mime_type || "audio/mpeg"
          urls.push(`data:${mime};base64,${part.inline_data.data}`)
        }
      }
    }
    if (urls.length === 0) throw new Error("Gemini 响应未包含音频数据")
    return { kind: "sync", urls, raw: json }
  }

  // OpenAI 音频：网关一般返回 { data: [{ url }] } 或直接 binary
  const data = Array.isArray(json?.data) ? json.data : []
  const urls: string[] = []
  for (const item of data) {
    if (typeof item?.url === "string") urls.push(item.url)
    else if (typeof item?.b64_json === "string") urls.push(`data:audio/mpeg;base64,${item.b64_json}`)
  }
  if (urls.length > 0) return { kind: "sync", urls, raw: json }
  if (json?.url) return { kind: "sync", urls: [json.url], raw: json }
  if (json?.error) throw new Error(json.error.message || "音频生成失败")
  throw new Error("响应未包含音频数据")
}

/* ------------------------------------------------------------------------- */
/* 视频异步任务轮询                                                              */
/* ------------------------------------------------------------------------- */

/**
 * 构造轮询 URL；支持自定义 pollPath 模板，否则按格式约定生成
 */
export function buildPollUrl(format: VideoFormat, baseURL: string, taskId: string, customPath?: string): string {
  if (customPath) {
    const p = customPath.replace("{taskId}", encodeURIComponent(taskId))
    return p.startsWith("http") ? p : `${baseURL}${p.startsWith("/") ? p : `/${p}`}`
  }
  switch (format) {
    case "sora":
      return `${baseURL}/v1/videos/${encodeURIComponent(taskId)}`
    case "kling":
      return `${baseURL}/kling/v1/videos/text2video/${encodeURIComponent(taskId)}`
    case "jimeng":
      return `${baseURL}/jimeng/v1/tasks/${encodeURIComponent(taskId)}`
    default:
      return `${baseURL}/v1/video/generations/${encodeURIComponent(taskId)}`
  }
}

export function parsePollResponse(format: VideoFormat, json: any): PollResult {
  if (format === "sora") {
    const status = json?.status as string | undefined
    if (status === "completed") {
      const url = sorContentUrl(json)
      const urls = url ? [url] : []
      return { status: "success", urls, raw: json }
    }
    if (status === "failed" || status === "cancelled") {
      return { status: "failed", error: json?.error?.message || "Sora 视频生成失败", raw: json }
    }
    const progress = typeof json?.progress === "number" ? json.progress : undefined
    return { status: "running", progress, raw: json }
  }

  if (format === "kling") {
    const taskStatus = json?.data?.task_status ?? json?.task_status
    if (taskStatus === "succeed" || taskStatus === "success") {
      const videos = json?.data?.task_result?.videos ?? json?.task_result?.videos ?? []
      const urls = (videos as any[]).map((v) => v?.url).filter(Boolean)
      return { status: "success", urls, raw: json }
    }
    if (taskStatus === "failed") {
      return { status: "failed", error: json?.data?.task_status_msg || "可灵视频生成失败", raw: json }
    }
    return { status: "running", raw: json }
  }

  if (format === "jimeng") {
    const status = json?.data?.status ?? json?.status
    if (status === "success" || status === "done") {
      const urls: string[] = []
      const videoUrl = json?.data?.video_url ?? json?.video_url
      if (videoUrl) urls.push(videoUrl)
      const list = json?.data?.video_urls ?? json?.video_urls
      if (Array.isArray(list)) urls.push(...list)
      return { status: "success", urls, raw: json }
    }
    if (status === "failed" || status === "error") {
      return { status: "failed", error: json?.data?.message || "即梦视频生成失败", raw: json }
    }
    return { status: "running", raw: json }
  }

  // 默认 OpenAI 视频任务
  const status = json?.status
  if (status === "succeeded" || status === "completed" || status === "success") {
    const urls = (json?.data ?? json?.outputs ?? [])
      .map((d: any) => d?.url ?? d?.video_url)
      .filter(Boolean)
    return { status: "success", urls, raw: json }
  }
  if (status === "failed" || status === "error") {
    return { status: "failed", error: json?.error?.message || "视频生成失败", raw: json }
  }
  return { status: "running", raw: json }
}

/* ------------------------------------------------------------------------- */
/* 工具函数                                                                    */
/* ------------------------------------------------------------------------- */

function sorContentUrl(json: any): string | undefined {
  return json?.video?.url ?? json?.url ?? json?.output?.[0]?.url
}

function deriveRatio(w: number, h: number): string {
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function parseGeminiAspect(size: string): string {
  const [w, h] = size.split("x").map(Number)
  if (!w || !h) return "1:1"
  return deriveRatio(w, h)
}
