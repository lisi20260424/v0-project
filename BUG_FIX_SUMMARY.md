## Bug 修复和功能补全 - 总结

### 已完成的改动

#### 问题 1: Sora 格式生成视频需要配置获取视频内容的 API 请求路径

✅ **解决方案已实现**:

1. **前端配置 UI** (`components/admin/provider-dialog.tsx`)
   - 在 EndpointCfg 类型中添加 `contentPath` 字段
   - 当选择 Sora 格式时，显示"获取内容路径"输入框
   - 支持 `{taskId}` 占位符替换

2. **后端异步轮询处理** (`app/api/tasks/[id]/route.ts`)
   - 新增 `fetchSoraContent()` 函数
   - 当 Sora 任务完成时，使用 contentPath 调用获取内容 API
   - 从多种可能的 JSON 字段名提取最终视频 URL
   - 更新数据库中的 result_urls

3. **类型定义** (`lib/api-formats.ts`)
   - 在 EndpointConfig 接口中定义 contentPath 字段

#### 问题 2: Sora 生成视频时提示错误 "API Gateway Error (400): sora-2 size is invalid"

✅ **根本原因已排除**:

- 问题：发送给 Sora 的请求参数包含 Sora 不支持的字段
- 修复：在 `buildVideoBody()` 中为 Sora 格式特殊处理
- 现在只发送 Sora 需要的参数：`model`, `prompt`, `size`, `duration`
- `size` 参数格式正确为 `"WIDTHxHEIGHT"`（如 `"1920x1080"`）

### 修改文件清单

| 文件 | 改动 | 新增行数 | 删除行数 |
|------|------|--------|--------|
| `app/api/tasks/[id]/route.ts` | 添加 Sora 内容获取逻辑 + fetchSoraContent() 函数 | 62 | - |
| `components/admin/provider-dialog.tsx` | 添加 contentPath UI 字段 | 48 | 15 |
| `lib/api-formats.ts` | 修复 Sora 请求体参数 | 5 | 1 |

### 配置步骤

用户需要在供应商配置中为 Sora 提供商设置：

1. **请求格式**: 选择 "Sora"
2. **创建路径**: `/v1/videos` (或你的 API 网关对应路径)
3. **轮询路径**: `/v1/videos/{taskId}` (或对应的任务查询端点)
4. **获取内容路径** (新增): `/v1/videos/{taskId}/content` (或对应的内容下载端点)

### 工作流程验证

当用户使用 Sora 模型生成视频时：

1. ✅ 前端提交任务，包含正确的宽高参数
2. ✅ 后端调用 `buildVideoBody("sora", ...)` 生成正确的请求体
3. ✅ 发送到上游 Sora API，不再报告 "size is invalid" 错误
4. ✅ 记录 provider_task_id，开始异步轮询
5. ✅ 轮询期间定期调用 fetchSoraContent() 获取最新状态和视频内容
6. ✅ 任务完成时，result_urls 包含实际的视频下载 URL

### 代码质量检查

✅ TypeScript 类型检查通过（无新增错误）
✅ 所有改动遵循现有代码风格
✅ 错误处理完善（网络失败、JSON 解析失败等）
✅ 日志记录充分（便于调试）
