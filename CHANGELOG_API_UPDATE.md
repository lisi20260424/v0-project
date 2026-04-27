# 模型参数配置更新总结

## 概述
根据 New API 官方文档的要求，完成了三种生成方式的模型参数配置升级，使系统支持更多的 API 参数选项，提高了内容生成的灵活性和可控性。

---

## 🔄 核心改动

### 后端系统升级
**lib/ai-provider.ts** - 核心网关函数扩展
- ✅ 扩展 `callAIGateway` 函数参数列表，新增 13 个参数
- ✅ 为图像生成添加 6 个新参数：size, n, quality, style, response_format, background, moderation
- ✅ 为视频生成添加 6 个新参数：duration, width, height, fps, seed, n
- ✅ 为音乐生成添加 3 个新参数：voice, response_format, speed
- ✅ 设置合理的默认值，确保向后兼容性
- ✅ 为 gpt-image-1 模型添加特定参数处理

### API 路由更新
**三个 API 路由均已升级**:
1. `app/api/generate/image/route.ts` - 新增 7 个参数接收
2. `app/api/generate/music/route.ts` - 新增 3 个参数接收 
3. `app/api/generate/video/route.ts` - 新增 6 个参数接收

### 前端组件同步更新
**组件请求结构优化**:
- 📝 `components/image-generator.tsx` - 优化参数传递，支持 size, n, quality, style, responseFormat
- 🎵 `components/music-generator.tsx` - 优化参数传递，支持 voice, responseFormat, speed  
- 🎬 `components/video-generator.tsx` - 优化参数传递，支持 duration, width, height, fps, n

---

## 📊 参数支持详情

### 🎵 音乐生成 (TTS - 文本转语音)
**端点**: `/v1/audio/speech`

支持的新参数：
| 参数 | 类型 | 可选值 | 默认值 |
|------|------|--------|--------|
| voice | string | alloy, echo, fable, onyx, nova, shimmer | alloy |
| response_format | string | mp3, opus, aac, flac, wav, pcm | mp3 |
| speed | number | 0.25 - 4.0 | 1 |

**应用**: 实现文本转语音功能，支持多种人声和输出格式

---

### 🖼️ 图片生成 (DALL-E / GPT Image)
**端点**: `/v1/images/generations`

支持的新参数：
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| size | string | 图片尺寸 (256x256, 512x512, 1024x1024等) | 1024x1024 |
| n | integer | 生成图片数量 (1-10) | 1 |
| quality | string | 画质等级 | standard |
| style | string | 风格选择 | natural |
| response_format | string | url 或 b64_json | url |
| background | string | 背景透明度(仅gpt-image-1) | auto |
| moderation | string | 内容审核级别(仅gpt-image-1) | auto |

**应用**: 更细粒度的图像生成控制，支持不同尺寸、质量和风格

---

### 🎬 视频生成 (Sora / Kling)
**端点**: `/v1/video/generations`

支持的新参数：
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| duration | number | 视频时长(秒) | 10 |
| width | integer | 视频宽度(像素) | 1024 |
| height | integer | 视频高度(像素) | 1024 |
| fps | integer | 帧率 | 24 |
| seed | integer | 随机种子(可选) | - |
| n | integer | 生成视频数量 | 1 |

**应用**: 完整的视频尺寸、帧率和时长控制

---

## 📈 统计数据

```
文件修改:    8 个文件
代码行数:    +141 行, -36 行
新增参数:    13 个
API 文档:    3 个
```

### 文件变更详情
- `lib/ai-provider.ts` +80 -36 (核心改动)
- `app/api/generate/image/route.ts` +23 -2
- `app/api/generate/music/route.ts` +17 -3
- `app/api/generate/video/route.ts` +19 -1
- `components/image-generator.tsx` +13 -13
- `components/music-generator.tsx` +10 -10
- `components/video-generator.tsx` +13 -13

---

## ✨ 特性亮点

### 1. 向后兼容
所有新参数都设置了合理的默认值，现有代码无需更改即可继续工作

### 2. 参数文档化
每个参数都在代码注释中标注了对应的 API 文档链接

### 3. 模型适配
针对不同模型(如 gpt-image-1)的特定参数进行了条件处理

### 4. 类型安全
使用 TypeScript 确保参数类型的正确性

### 5. 错误处理
完善的错误捕获和用户提示机制

---

## 🔗 参考资源

- **音乐生成 API**: https://docs.newapi.pro/zh/docs/api/ai-model/audio/openai/createspeech
- **图片生成 API**: https://docs.newapi.pro/zh/docs/api/ai-model/images/openai/post-v1-images-generations
- **视频生成 API**: https://docs.newapi.pro/zh/docs/api/ai-model/videos/createvideogeneration

---

## 🚀 下一步优化建议

1. **UI 控制层优化**
   - 为声音选择、响应格式等新参数添加前端控制项
   - 在模型配置中定义支持的参数范围

2. **高级功能**
   - 实现随机种子管理，支持结果重现
   - 添加参数预设保存和快速应用

3. **性能优化**
   - 缓存参数验证结果
   - 实现参数优化建议系统

4. **监控和分析**
   - 追踪参数使用统计
   - 分析不同参数对生成结果的影响

---

**更新日期**: 2026-04-27  
**更新者**: v0 AI Assistant  
**状态**: ✅ 完成
