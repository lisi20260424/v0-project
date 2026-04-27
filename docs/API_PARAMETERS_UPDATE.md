# API 参数配置更新

本文档记录了根据 New API 官方文档更新的模型参数配置。

## 更新概览

根据以下 API 文档，已更新三种生成方式的参数配置：

1. **音乐生成 (TTS)**: https://docs.newapi.pro/zh/docs/api/ai-model/audio/openai/createspeech
2. **图片生成**: https://docs.newapi.pro/zh/docs/api/ai-model/images/openai/post-v1-images-generations
3. **视频生成**: https://docs.newapi.pro/zh/docs/api/ai-model/videos/createvideogeneration

---

## 详细更新

### 1. 音乐生成 API (文本转语音) 

**端点**: `/v1/audio/speech`

**支持的参数**:

| 参数 | 类型 | 范围/值 | 说明 |
|-----|------|--------|------|
| `model` | string | - | 模型 ID |
| `input` | string | 最大 4096 字符 | 要转换的文本 |
| `voice` | string | "alloy" \| "echo" \| "fable" \| "onyx" \| "nova" \| "shimmer" | 人声选择 |
| `response_format` | string | "mp3" \| "opus" \| "aac" \| "flac" \| "wav" \| "pcm" | 输出格式，默认 "mp3" |
| `speed` | number | 0.25 - 4.0 | 播放速度，默认 1.0 |

**代码位置**: 
- `lib/ai-provider.ts` - `callAIGateway` 函数
- `app/api/generate/music/route.ts` - 音乐生成 API 路由
- `components/music-generator.tsx` - 前端音乐生成器

**新增参数接收**:
```typescript
{
  modelId: string
  description: string
  voice?: string           // 人声选择
  responseFormat?: string  // 输出格式
  speed?: number          // 播放速度
}
```

---

### 2. 图片生成 API

**端点**: `/v1/images/generations`

**支持的参数**:

| 参数 | 类型 | 范围/值 | 说明 |
|-----|------|--------|------|
| `model` | string | "dall-e-2" \| "dall-e-3" \| "gpt-image-1" | 模型选择 |
| `prompt` | string | 见文档 | 图片描述提示词 |
| `n` | integer | 1-10 | 生成图片数量 |
| `size` | string | 见模型文档 | 图片尺寸 |
| `quality` | string | - | 画质等级 |
| `style` | string | - | 风格选择 |
| `response_format` | string | "url" \| "b64_json" | 返回格式 |
| `background` | string | "transparent" \| "opaque" \| "auto" | 背景透明度（仅 gpt-image-1） |
| `moderation` | string | "low" \| "auto" | 内容审核级别（仅 gpt-image-1） |

**代码位置**:
- `lib/ai-provider.ts` - `callAIGateway` 函数
- `app/api/generate/image/route.ts` - 图片生成 API 路由
- `components/image-generator.tsx` - 前端图片生成器

**新增参数接收**:
```typescript
{
  modelId: string
  prompt: string
  size?: string           // 图片尺寸
  n?: number             // 生成数量
  quality?: string       // 画质
  style?: string         // 风格
  responseFormat?: string // 返回格式
  background?: string    // 背景透明度
  moderation?: string    // 内容审核
}
```

---

### 3. 视频生成 API

**端点**: `/v1/video/generations`

**支持的参数**:

| 参数 | 类型 | 范围/值 | 说明 |
|-----|------|--------|------|
| `model` | string | - | 模型/风格 ID |
| `prompt` | string | - | 文本描述提示词 |
| `duration` | number | - | 视频时长（秒） |
| `width` | integer | - | 视频宽度（像素） |
| `height` | integer | - | 视频高度（像素） |
| `fps` | integer | - | 视频帧率 |
| `seed` | integer | - | 随机种子（可选） |
| `n` | integer | - | 生成视频数量 |
| `response_format` | string | - | 响应格式 |

**代码位置**:
- `lib/ai-provider.ts` - `callAIGateway` 函数
- `app/api/generate/video/route.ts` - 视频生成 API 路由
- `components/video-generator.tsx` - 前端视频生成器

**新增参数接收**:
```typescript
{
  modelId: string
  prompt: string
  duration?: number   // 视频时长
  width?: number     // 视频宽度
  height?: number    // 视频高度
  fps?: number       // 帧率
  seed?: number      // 随机种子
  n?: number         // 生成数量
}
```

---

## 修改文件列表

### 后端文件

1. **lib/ai-provider.ts**
   - 扩展 `callAIGateway` 函数参数，支持所有新增参数
   - 为三种生成类型构建相应的请求体
   - 添加参数验证和默认值处理

2. **app/api/generate/image/route.ts**
   - 新增参数接收：size, n, quality, style, responseFormat, background, moderation
   - 传递参数给 `callAIGateway` 函数

3. **app/api/generate/music/route.ts**
   - 新增参数接收：voice, responseFormat, speed
   - 传递参数给 `callAIGateway` 函数
   - 更新文本长度限制为 4096 字符

4. **app/api/generate/video/route.ts**
   - 新增参数接收：duration, width, height, fps, seed, n
   - 传递参数给 `callAIGateway` 函数

### 前端文件

1. **components/image-generator.tsx**
   - 更新图片生成请求，传递 size, n, quality, style, responseFormat
   - 修改参数结构从 `params` 对象到顶级参数

2. **components/music-generator.tsx**
   - 更新音乐生成请求，传递 voice, responseFormat, speed
   - 修改参数结构从 `params` 对象到顶级参数

3. **components/video-generator.tsx**
   - 更新视频生成请求，传递 duration, width, height, fps, n
   - 修改参数结构从 `params` 对象到顶级参数
   - 从 durationId 解析出具体的秒数值

---

## 参数默认值

### 音乐生成
- `voice`: "alloy"
- `responseFormat`: "mp3"
- `speed`: 1

### 图片生成
- `size`: "1024x1024"
- `n`: 1
- `quality`: "standard"
- `style`: "natural"
- `responseFormat`: "url"
- `background`: "auto"
- `moderation`: "auto"

### 视频生成
- `duration`: 10
- `width`: 1024
- `height`: 1024
- `fps`: 24
- `n`: 1
- `seed`: 可选，未设置时不传递

---

## 后续优化建议

1. **前端 UI 优化**: 为新增参数添加前端控制项（如声音选择、响应格式等）
2. **参数验证**: 在 API 路由中添加更严格的参数验证
3. **错误处理**: 完善网关错误响应的处理和用户反馈
4. **文档完善**: 在模型能力配置中定义每个模型支持的具体参数范围

---

**最后更新**: 2026-04-27
