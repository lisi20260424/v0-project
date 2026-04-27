# Sora 集成 Bug 修复与功能补全

## 问题 1: Sora 视频内容获取 API 路径配置

### 需求
Sora 生成视频需要两个步骤：
1. 创建任务（POST 到创建端点）获得任务 ID
2. 轮询任务状态（GET 到轮询端点）
3. 任务完成后，从内容获取端点（GET）取得实际视频 URL

### 解决方案
在供应商配置中为 Sora 添加 `contentPath` 字段，用于指定获取视频内容的 API 路径。

#### 修改的文件

**1. `components/admin/provider-dialog.tsx`**
- 在 `EndpointCfg` 类型中添加 `contentPath?: string` 字段
- 在 `EndpointFields` 组件中：
  - 检测当前格式是否为 Sora (`isSora`)
  - 当 `isSora` 为 true 时，显示"获取内容路径（Sora 特定）"输入框
  - 支持 `{taskId}` 占位符替换

**2. `lib/api-formats.ts`**
- 在 `EndpointConfig` 类型中添加 `contentPath?: string` 字段说明

**3. `app/api/tasks/[id]/route.ts`**
- 添加 `fetchSoraContent()` 函数：
  - 使用 `contentPath` 模板构造获取 URL
  - 发送 GET 请求到上游 API
  - 从多个可能的字段名提取视频 URL（url, video_url, data.url 等）
- 在 `maybePollVideoTask()` 中：
  - 当任务成功且为 Sora 时，若配置了 `contentPath`，则调用 `fetchSoraContent()`
  - 用获取到的实际视频 URL 更新 `result_urls`

### 配置示例

对于 Sora 供应商，在"API 端点配置"中配置：
- **请求格式**: Sora
- **创建路径**: `/v1/videos`（或你的 API 网关路径）
- **轮询路径**: `/v1/videos/{taskId}`（或对应的轮询端点）
- **获取内容路径**: `/v1/videos/{taskId}/content`（新增字段，Sora 特定）

## 问题 2: Sora 视频生成请求参数错误 (400: sora-2 size is invalid)

### 根本原因
原始代码向 Sora 发送的请求体包含不支持的参数。Sora API 要求的参数格式与通用 OpenAI 格式有区别。

### 解决方案
在 `lib/api-formats.ts` 的 `buildVideoBody()` 函数中，特殊处理 Sora 格式：

```typescript
if (format === "sora") {
  return {
    body: {
      model: modelId,
      prompt,
      size: sizeStr,           // "1920x1080" 格式
      duration: String(duration),
    },
  }
}
```

**关键点**:
- 只发送 Sora 需要的参数：`model`, `prompt`, `size`, `duration`
- `size` 参数格式为 `"WIDTHxHEIGHT"`（如 `"1920x1080"`）
- `duration` 作为字符串发送
- 不发送 OpenAI 特有的参数如 `width`, `height`, `fps`, `n`, `seed` 等

### 修改的文件

**`lib/api-formats.ts`**
- 在 `buildVideoBody()` 函数中为 Sora 格式构造正确的请求体
- 移除不被 Sora 支持的参数

## 集成流程图

### Sora 视频生成完整流程

```
1. 用户在视频生成器中输入提示词并点击生成
2. 前端 POST /api/tasks 创建任务
   ↓
3. 后端调用 callAIGateway()
   - 使用 buildVideoBody("sora", params) 构造请求
   - 发送 POST 到上游创建端点
   ↓
4. 上游返回 { id: "xxx", status: "queued" }
   - 后端创建 generation_task 记录
   - 设置 provider_task_id = "xxx"
   - 返回 { task: {..., status: "running" } }
   ↓
5. 前端开始定时轮询 GET /api/tasks/[id]
   ↓
6. 后端在轮询中调用 pollProviderTask()
   - 发送 GET 到轮询端点获取状态
   - 若状态为 completed，调用 fetchSoraContent()
   - 使用 contentPath 模板构造 URL
   - 发送 GET 请求获取实际视频 URL
   ↓
7. 任务完成，前端收到 result_urls，展示视频
```

## 测试检查项

- [ ] 在供应商管理后台配置 Sora 提供商，设置所有三个路径
- [ ] 使用 Sora 模型生成视频，确认不再报告 "size is invalid" 错误
- [ ] 验证任务成功后能获取到实际的视频 URL
- [ ] 检查轮询过程中进度百分比更新正常

## 相关代码位置

| 文件 | 主要改动 |
|------|--------|
| `components/admin/provider-dialog.tsx` | 添加 contentPath UI |
| `lib/api-formats.ts` | Sora 参数优化 + contentPath 类型定义 |
| `app/api/tasks/[id]/route.ts` | fetchSoraContent() 函数 + Sora 特殊流程 |
| `lib/ratio-dimensions-mapping.ts` | 视频尺寸映射（已验证正确） |
| `components/video-generator.tsx` | 传递正确的宽高参数（已验证正确） |
