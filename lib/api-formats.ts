/**
 * Multi-provider API request/response adapters.
 *
 * Supported formats:
 * - Image: openai / gemini / qwen-openai
 * - Video: openai / jimeng / kling / sora
 * - Music: openai / gemini
 */

export type GenerationType = "image" | "video" | "music"

export type ImageFormat = "openai" | "gemini" | "qwen-openai"
export type VideoFormat = "openai" | "jimeng" | "kling" | "sora"
export type MusicFormat = "openai" | "gemini"
export type AnyFormat = ImageFormat | VideoFormat | MusicFormat

export type EndpointConfig = {
  path: string
  format: AnyFormat
  // Polling path template for async video tasks. It may include a {taskId} placeholder.
  pollPath?: string
  // Sora-only content path template. It may include a {taskId} placeholder.
  contentPath?: string
}

/** Default endpoints used when no provider endpoint is configured. */
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

/** Unified parsed response: sync URL result, async task result, or binary result. */
export type ParsedResponse =
  | { kind: "sync"; urls: string[]; raw: unknown }
  | { kind: "async"; providerTaskId: string; raw: unknown }
  | { kind: "binary"; binary: true; raw: unknown }

/** Polling result for async video tasks. */
export type PollResult =
  | { status: "running"; progress?: number; raw: unknown }
  | { status: "success"; urls: string[]; raw: unknown }
  | { status: "failed"; error: string; raw: unknown }

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
  void fps
  void n
  void seed
  void sizeStr

  if (format === "sora") {
    return {
      body: {
        model: modelId,
        prompt,
        width,
        height,
        seconds: String(duration),
      },
    }
  }

  if (format === "kling") {
    const body: Record<string, any> = {
      model_name: modelId,
      prompt,
      duration: String(duration),
      aspect_ratio: ratioStr,
    }
    if (negative) body.negative_prompt = negative
    return { body }
  }

  if (format === "jimeng") {
    const body: Record<string, any> = {
      req_key: modelId,
      prompt,
      width,
      height,
      seconds: String(duration),
    }
    return { body }
  }

  const body: Record<string, any> = {
    model: modelId,
    prompt,
    width,
    height,
    seconds: String(duration),
  }
  return { body }
}

function buildMusicBody(format: MusicFormat, p: MusicRequestParams) {
  const { prompt, modelId, voice = "alloy", responseFormat = "mp3", speed = 1 } = p

  if (format === "gemini") {
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

export async function parseResponse(
  type: GenerationType,
  format: AnyFormat,
  response: Response,
): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.startsWith("audio/") || contentType.startsWith("video/") || contentType.startsWith("image/")) {
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
    if (json?.id) {
      const url = sorContentUrl(json)
      if (json?.status === "completed" && url) return { kind: "sync", urls: [url], raw: json }
      return { kind: "async", providerTaskId: String(json.id), raw: json }
    }
    if (json?.error) throw new Error(json.error.message || "Sora 任务创建失败")
    throw new Error("Sora 响应缺少任务 ID")
  }

  if (format === "kling") {
    const taskId = json?.data?.task_id ?? json?.task_id
    if (taskId) return { kind: "async", providerTaskId: String(taskId), raw: json }
    throw new Error("可灵响应缺少 task_id")
  }

  if (format === "jimeng") {
    const taskId = json?.data?.task_id ?? json?.task_id
    if (taskId) return { kind: "async", providerTaskId: String(taskId), raw: json }
    throw new Error("即梦响应缺少 task_id")
  }

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

/** Build polling URL for async video tasks. */
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

  let status = json?.status
  if (!status) status = json?.data?.status
  if (!status) status = json?.code

  if (status === "succeeded" || status === "completed" || status === "success" || status === "SUCCESS") {
    const urls: string[] = []

    if (typeof json?.url === "string" && json.url.trim()) {
      urls.push(json.url.trim())
    } else if (typeof json?.video_url === "string" && json.video_url.trim()) {
      urls.push(json.video_url.trim())
    } else if (typeof json?.result_url === "string" && json.result_url.trim()) {
      urls.push(json.result_url.trim())
    } else if (typeof json?.data?.url === "string" && json.data.url.trim()) {
      urls.push(json.data.url.trim())
    } else if (typeof json?.data?.video_url === "string" && json.data.video_url.trim()) {
      urls.push(json.data.video_url.trim())
    } else if (typeof json?.data?.result_url === "string" && json.data.result_url.trim()) {
      urls.push(json.data.result_url.trim())
    } else if (typeof json?.data?.data?.url === "string" && json.data.data.url.trim()) {
      urls.push(json.data.data.url.trim())
    } else if (typeof json?.data?.data?.video_url === "string" && json.data.data.video_url.trim()) {
      urls.push(json.data.data.video_url.trim())
    } else if (typeof json?.data?.data?.result_url === "string" && json.data.data.result_url.trim()) {
      urls.push(json.data.data.result_url.trim())
    } else if (Array.isArray(json?.data)) {
      for (const d of json.data) {
        if (typeof d?.url === "string" && d.url.trim()) {
          urls.push(d.url.trim())
        } else if (typeof d?.video_url === "string" && d.video_url.trim()) {
          urls.push(d.video_url.trim())
        } else if (typeof d?.result_url === "string" && d.result_url.trim()) {
          urls.push(d.result_url.trim())
        }
      }
    } else if (Array.isArray(json?.outputs)) {
      for (const o of json.outputs) {
        if (typeof o?.url === "string" && o.url.trim()) {
          urls.push(o.url.trim())
        } else if (typeof o?.video_url === "string" && o.video_url.trim()) {
          urls.push(o.video_url.trim())
        } else if (typeof o?.result_url === "string" && o.result_url.trim()) {
          urls.push(o.result_url.trim())
        }
      }
    }

    return { status: "success", urls, raw: json }
  }

  if (status === "failed" || status === "error" || status === "FAILED") {
    return { status: "failed", error: json?.error?.message || json?.fail_reason || "视频生成失败", raw: json }
  }

  return { status: "running", raw: json }
}

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
