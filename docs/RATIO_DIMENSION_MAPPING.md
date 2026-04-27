# 比例到尺寸映射关系

本文档说明了系统如何根据用户选择的比例转换为标准尺寸参数。

## 快速参考

### 图片生成尺寸映射

| 比例ID | 比例 | 转换尺寸 | 应用场景 |
|--------|------|--------|--------|
| `11` | 1:1 | `1024x1024` | 头像、插画、海报、表情包 |
| `916` | 9:16 | `1024x1792` | 抖音/朋友圈/手机壁纸 |
| `169` | 16:9 | `1792x1024` | 电脑壁纸、封面、视频封面 |
| `43` | 4:3 | `1024x768` | 日常照片、作品展示 |
| `34` | 3:4 | `768x1024` | 小红书、图文配图 |
| `21` | 2:1 | `1536x768` | 横幅海报、banner |
| `12` | 1:2 | `768x1536` | 长图描画、人物全身 |

### 视频生成尺寸映射

| 比例ID | 比例 | 转换尺寸 (宽×高) | 应用场景 |
|--------|------|--------|--------|
| `11` | 1:1 | `1080×1080` | 小红书、Instagram正方形 |
| `916` | 9:16 | `1080×1920` | 抖音/快手/小红书竖屏 |
| `169` | 16:9 | `1920×1080` | B站/油管/电影/机器屏 |
| `43` | 4:3 | `1440×1080` | 日常照片、作品展示 |
| `34` | 3:4 | `1080×1440` | 小红书、图文配图 |

## 实现方式

### 调用流程

```
用户选择比例 (ratioId)
          ↓
前端组件获取 ratioId (如 "916")
          ↓
调用 getImageDimension() 或 getVideoDimensions()
          ↓
返回标准尺寸 (如 "1024x1792" 或 { width: 1080, height: 1920 })
          ↓
发送到 API 路由
          ↓
API 路由转发给 AI 网关
          ↓
网关使用标准尺寸生成内容
```

### 函数签名

#### 图片生成

```typescript
// 输入: 比例 ID
// 输出: 尺寸字符串 "WIDTHxHEIGHT"
getImageDimension(ratioId: string): string

// 例:
getImageDimension("916")  // → "1024x1792"
getImageDimension("11")   // → "1024x1024"
```

#### 视频生成

```typescript
// 输入: 比例 ID
// 输出: { width, height } 对象
getVideoDimensions(ratioId: string): { width: number; height: number }

// 例:
getVideoDimensions("916")  // → { width: 1080, height: 1920 }
getVideoDimensions("11")   // → { width: 1080, height: 1080 }
```

## 参考文档

- 第一张参考图：视频常用尺寸表
  - 包含 5 种比例的视频和画图对应尺寸

- 第二张参考图：常用比例和推荐尺寸表
  - 包含 8 种常见比例的多个推荐尺寸
  - 所有尺寸都是 8 的倍数，适配 SD1.5/SDXL/Flux
  - NewAPI 直接就能使用，无需报错、不报错、不做改变

## 配置文件

映射关系定义在 `lib/ratio-dimensions-mapping.ts` 中：

```typescript
export const IMAGE_DIMENSION_MAP: Record<string, string>
export const VIDEO_DIMENSION_MAP: Record<string, { width: number; height: number }>

export function getImageDimension(ratioId: string): string
export function getVideoDimensions(ratioId: string): { width: number; height: number }
```

## 组件集成点

### 图片生成器 (components/image-generator.tsx)

```typescript
import { getImageDimension } from "@/lib/ratio-dimensions-mapping"

// 在 API 调用中使用:
body: JSON.stringify({
  modelId: model.id,
  prompt,
  size: getImageDimension(ratioId),  // ← 转换比例为尺寸
  n: count,
  quality,
  style,
  responseFormat: "url",
})
```

### 视频生成器 (components/video-generator.tsx)

```typescript
import { getVideoDimensions } from "@/lib/ratio-dimensions-mapping"

// 在 API 调用中使用:
const { width, height } = getVideoDimensions(ratioId)  // ← 转换比例为宽高

body: JSON.stringify({
  modelId: model.id,
  prompt,
  duration: durationId ? parseInt(durationId) : 10,
  width,    // ← 使用转换后的宽度
  height,   // ← 使用转换后的高度
  fps: 24,
  n: count,
})
```

## 扩展新比例

若需要添加新的比例映射，在 `lib/ratio-dimensions-mapping.ts` 中：

### 添加图片尺寸

```typescript
export const IMAGE_DIMENSION_MAP: Record<string, string> = {
  // ... 现有映射
  "21": "1536x768",  // 新增: 2:1 宽幅
}
```

### 添加视频尺寸

```typescript
export const VIDEO_DIMENSION_MAP: Record<string, { width: number; height: number }> = {
  // ... 现有映射
  "21": { width: 1536, height: 768 },  // 新增: 2:1 宽幅
}
```

## 注意事项

1. **尺寸标准化**: 所有尺寸都遵循 NewAPI 的标准尺寸规范，确保 100% 兼容

2. **默认值处理**: 若传入的 ratioId 不在映射表中，函数返回默认尺寸 `1024x1024` (图片) 或 `{ width: 1080, height: 1080 }` (视频)

3. **尺寸格式**:
   - 图片: `"WIDTHxHEIGHT"` (小写 x, 如 `"1024x1792"`)
   - 视频: 分别为 `width` 和 `height` 参数

4. **性能**: 映射查询是 O(1) 的字典查找，性能无忧

## 测试用例

### 验证图片映射

```typescript
const testCases = [
  { ratioId: "11", expected: "1024x1024" },
  { ratioId: "916", expected: "1024x1792" },
  { ratioId: "169", expected: "1792x1024" },
  { ratioId: "43", expected: "1024x768" },
  { ratioId: "34", expected: "768x1024" },
  { ratioId: "unknown", expected: "1024x1024" },  // 默认值
]

testCases.forEach(({ ratioId, expected }) => {
  const result = getImageDimension(ratioId)
  console.assert(result === expected, `图片映射失败: ${ratioId} → ${result}`)
})
```

### 验证视频映射

```typescript
const testCases = [
  { ratioId: "11", expected: { width: 1080, height: 1080 } },
  { ratioId: "916", expected: { width: 1080, height: 1920 } },
  { ratioId: "169", expected: { width: 1920, height: 1080 } },
  { ratioId: "unknown", expected: { width: 1080, height: 1080 } },  // 默认值
]

testCases.forEach(({ ratioId, expected }) => {
  const result = getVideoDimensions(ratioId)
  console.assert(
    result.width === expected.width && result.height === expected.height,
    `视频映射失败: ${ratioId} → ${JSON.stringify(result)}`
  )
})
```
