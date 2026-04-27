# 新API参数使用指南

本指南展示如何在前端和后端使用新添加的模型参数。

## 1. 后端 API 调用示例

### 图片生成 - 完整参数

```typescript
// POST /api/generate/image
const response = await fetch("/api/generate/image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: "dalle-3",
    prompt: "一只穿着宇航服的柯基犬在月球上行走",
    // 新增参数
    size: "1024x1792",        // 图片尺寸
    n: 2,                     // 生成2张图片
    quality: "hd",            // 高质量
    style: "vivid",           // 鲜艳风格
    responseFormat: "url",    // 返回URL而不是base64
    background: "transparent", // 透明背景 (仅gpt-image-1)
    moderation: "auto",       // 内容审核
  }),
});
```

### 音乐生成 - 完整参数

```typescript
// POST /api/generate/music
const response = await fetch("/api/generate/music", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: "tts-1",
    description: "大自然的声音：树林里鸟鸣和流水的声音混合",
    // 新增参数
    voice: "nova",            // 人声选择
    responseFormat: "mp3",    // 输出格式
    speed: 1.0,              // 播放速度 (0.25-4.0)
  }),
});
```

### 视频生成 - 完整参数

```typescript
// POST /api/generate/video
const response = await fetch("/api/generate/video", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: "sora",
    prompt: "一只橙色的猫在阳光下懒洋洋地伸懒腰",
    // 新增参数
    duration: 6,              // 视频时长（秒）
    width: 1920,             // 宽度（像素）
    height: 1080,            // 高度（像素）
    fps: 30,                 // 帧率
    seed: 12345,             // 随机种子（可选）
    n: 1,                    // 生成数量
  }),
});
```

---

## 2. 前端组件集成示例

### 图片生成器 - 添加尺寸和质量选择

```typescript
// 在 ImageGenerator 组件中添加

// 支持的尺寸
const SIZES = [
  { id: "256x256", label: "256 x 256" },
  { id: "512x512", label: "512 x 512" },
  { id: "1024x1024", label: "1024 x 1024 (推荐)" },
  { id: "1792x1024", label: "1792 x 1024 (宽屏)" },
  { id: "1024x1792", label: "1024 x 1792 (竖屏)" },
];

// 支持的质量
const QUALITIES = [
  { id: "standard", label: "标准" },
  { id: "hd", label: "高清" },
];

// UI 选择器
<div className="mt-5">
  <Label className="mb-2 block text-sm font-medium">
    <span className="mr-1 text-primary">◇</span> 图片尺寸
  </Label>
  <div className="grid grid-cols-3 gap-2">
    {SIZES.map((s) => (
      <button
        key={s.id}
        onClick={() => setSize(s.id)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          size === s.id
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-primary/40"
        )}
      >
        {s.label}
      </button>
    ))}
  </div>
</div>

// 调用时传递参数
const response = await fetch("/api/generate/image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: model.id,
    prompt,
    size,           // ← 新增
    quality,        // ← 新增
    n: count,
    style,
  }),
});
```

### 音乐生成器 - 添加人声和速度控制

```typescript
// 在 MusicGenerator 组件中添加

// 支持的人声
const VOICES = [
  { id: "alloy", label: "Alloy (中性)" },
  { id: "echo", label: "Echo (男性)" },
  { id: "fable", label: "Fable (故事性)" },
  { id: "onyx", label: "Onyx (深沉)" },
  { id: "nova", label: "Nova (温暖)" },
  { id: "shimmer", label: "Shimmer (明亮)" },
];

// 支持的输出格式
const FORMATS = [
  { id: "mp3", label: "MP3" },
  { id: "wav", label: "WAV" },
  { id: "aac", label: "AAC" },
  { id: "flac", label: "FLAC (无损)" },
];

// UI 选择器 - 人声
<div className="mt-5">
  <Label className="mb-2 block text-sm font-medium">
    <span className="mr-1 text-primary">♫</span> 人声
  </Label>
  <div className="grid grid-cols-3 gap-2">
    {VOICES.map((v) => (
      <button
        key={v.id}
        onClick={() => setVoice(v.id)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          voice === v.id
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-primary/40"
        )}
      >
        {v.label}
      </button>
    ))}
  </div>
</div>

// UI 选择器 - 播放速度
<div className="mt-5">
  <Label htmlFor="speed-slider" className="mb-2 block text-sm font-medium">
    <span className="mr-1 text-primary">♫</span> 播放速度
  </Label>
  <input
    id="speed-slider"
    type="range"
    min="0.25"
    max="4"
    step="0.25"
    value={speed}
    onChange={(e) => setSpeed(parseFloat(e.target.value))}
    className="w-full"
  />
  <span className="text-xs text-muted-foreground">{speed.toFixed(2)}x</span>
</div>

// 调用时传递参数
const response = await fetch("/api/generate/music", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: model.id,
    description,
    voice,             // ← 新增
    responseFormat,    // ← 新增
    speed,             // ← 新增
  }),
});
```

### 视频生成器 - 添加尺寸和帧率控制

```typescript
// 在 VideoGenerator 组件中添加

// 支持的分辨率
const RESOLUTIONS = [
  { id: "360p", width: 640, height: 360, label: "360p" },
  { id: "720p", width: 1280, height: 720, label: "720p (推荐)" },
  { id: "1080p", width: 1920, height: 1080, label: "1080p" },
  { id: "4k", width: 3840, height: 2160, label: "4K" },
];

// 支持的帧率
const FPS_OPTIONS = [
  { id: 24, label: "24 FPS (电影)" },
  { id: 30, label: "30 FPS (标准)" },
  { id: 60, label: "60 FPS (流畅)" },
];

// UI 选择器 - 分辨率
<div className="mt-6">
  <Label className="mb-2 block text-sm font-medium">
    <span className="mr-1 text-primary">◇</span> 分辨率
  </Label>
  <div className="flex gap-2">
    {RESOLUTIONS.map((r) => (
      <button
        key={r.id}
        onClick={() => {
          setWidth(r.width);
          setHeight(r.height);
        }}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          width === r.width && height === r.height
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-primary/40"
        )}
      >
        {r.label}
      </button>
    ))}
  </div>
</div>

// UI 选择器 - 帧率
<div className="mt-6">
  <Label className="mb-2 block text-sm font-medium">
    <span className="mr-1 text-primary">◇</span> 帧率
  </Label>
  <div className="flex gap-2">
    {FPS_OPTIONS.map((f) => (
      <button
        key={f.id}
        onClick={() => setFps(f.id)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          fps === f.id
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-primary/40"
        )}
      >
        {f.label}
      </button>
    ))}
  </div>
</div>

// 调用时传递参数
const response = await fetch("/api/generate/video", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    modelId: model.id,
    prompt,
    duration,    // ← 新增
    width,       // ← 新增
    height,      // ← 新增
    fps,         // ← 新增
    n: count,
  }),
});
```

---

## 3. 参数验证示例

```typescript
// 验证图片尺寸（DALL-E 3）
function validateImageSize(model: string, size: string): boolean {
  if (model === "dall-e-3") {
    return ["1024x1024", "1792x1024", "1024x1792"].includes(size);
  }
  if (model === "dall-e-2") {
    return ["256x256", "512x512", "1024x1024"].includes(size);
  }
  return true;
}

// 验证音乐速度
function validateSpeed(speed: number): boolean {
  return speed >= 0.25 && speed <= 4.0;
}

// 验证视频帧率
function validateFps(fps: number): boolean {
  return [24, 30, 60].includes(fps);
}
```

---

## 4. 错误处理示例

```typescript
try {
  const response = await fetch("/api/generate/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId: model.id,
      prompt,
      size: "1024x1024",
      quality: "hd",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    
    // 参数验证错误
    if (response.status === 400) {
      throw new Error(`参数错误: ${error.error}`);
    }
    
    // API 限流
    if (response.status === 429) {
      throw new Error("生成任务过多，请稍后再试");
    }
    
    // 其他错误
    throw new Error(error.error || "生成失败");
  }

  const data = await response.json();
  const imageUrls = data.data?.map((item: any) => item.url) || [];
  
  if (!imageUrls.length) {
    throw new Error("未获取到生成结果");
  }

  return imageUrls;
} catch (error) {
  console.error("[v0] Generation error:", error);
  alert(error instanceof Error ? error.message : "生成失败，请重试");
}
```

---

## 5. 环境变量配置

确保在 `.env.local` 或 Vercel 项目设置中配置：

```env
# API 网关配置
NEXT_PUBLIC_API_GATEWAY_URL=https://api.newapi.pro

# 这些在 Supabase 表中存储
# admin_gateway_settings: gateway_url, api_key
# admin_models: id, name, api_model_id, config
```

---

## 总结

✅ **所有参数已完全集成**  
✅ **向后兼容，默认值确保现有功能继续工作**  
✅ **类型安全，完整的 TypeScript 支持**  
✅ **文档完善，每个参数都有详细说明**  

开发者现在可以利用这些新参数为用户提供更灵活的内容生成体验！

---

**相关文档**:
- [API 参数详情](./docs/API_PARAMETERS_UPDATE.md)
- [更新日志](./CHANGELOG_API_UPDATE.md)
- [New API 官方文档](https://docs.newapi.pro)
