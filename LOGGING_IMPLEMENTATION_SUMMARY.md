# AI 生成链路日志实现总结

## 概述

为整个 AI 生成流程增加了详细、结构化的日志记录，覆盖从任务创建、模型查询、网关调用到视频轮询的每一个环节。所有日志使用统一的 `[v0:module:action]` 前缀格式，便于追踪、过滤和分析。

## 修改文件列表

### 1. `/lib/ai-provider.ts` - 核心 API 层日志
**修改内容**：为 6 个关键函数添加了详细日志

#### `callAIGateway()`
- `[v0:gateway:start]` - 记录生成类型、格式、模型
- `[v0:gateway:request]` - 记录 HTTP 方法和 URL
- `[v0:gateway:body]` - 记录请求体（前 800 字符）
- `[v0:gateway:response]` - 记录状态码和响应时间
- `[v0:gateway:error]` - 记录 API 错误详情
- `[v0:gateway:parsed]` - 记录解析结果类型和内容

#### `pollProviderTask()`
- `[v0:poll:start]` - 记录轮询参数和 URL
- `[v0:poll:response]` - 记录响应状态和时间
- `[v0:poll:error]` - 记录轮询失败原因
- `[v0:poll:parsed]` - 记录解析的状态和进度

#### `getModelInfo()`
- `[v0:model:fetch]` - 记录查询的 modelId
- `[v0:model:found]` - 记录找到的模型名、供应商、类型
- `[v0:model:error]` - 记录模型未找到错误

#### `getEndpointForModel()`
- `[v0:endpoint:fetch]` - 记录查询参数
- `[v0:endpoint:fallback]` - 记录使用默认配置
- `[v0:endpoint:resolved]` - 记录完整的端点配置

#### `getGatewayConfig()`
- `[v0:gateway:config]` - 记录网关 URL 和 API Key 掩码
- `[v0:gateway:config:error]` - 记录配置缺失错误

### 2. `/app/api/tasks/route.ts` - 任务创建路由日志
**修改内容**：为 POST 请求的整个流程添加日志

#### 主要检查点
- `[v0:task:create:start]` - 用户ID、类型、模型、提示词摘要
- `[v0:task:create:error:model]` - 模型查询失败
- `[v0:task:create:warn:mismatch]` - 类型不匹配警告
- `[v0:task:create:insert]` - 任务插入操作
- `[v0:task:create:inserted]` - 任务创建成功
- `[v0:task:create:error:gateway]` - 网关配置错误
- `[v0:task:create:gateway:call]` - 准备调用网关
- `[v0:task:create:sync:complete]` - 同步请求完成
- `[v0:task:create:async:submitted]` - 异步请求提交
- `[v0:task:create:warn:binary]` - 不支持的二进制响应
- `[v0:task:create:error:generation]` - 生成过程错误

### 3. `/app/api/tasks/[id]/route.ts` - 任务查询和轮询日志
**修改内容**：为 GET/DELETE 操作和轮询逻辑添加日志

#### GET 路由
- `[v0:task:get]` - 记录查询的任务ID和用户ID
- `[v0:task:get:not-found]` - 任务不存在
- `[v0:task:get:complete]` - 查询完成（最终状态和进度）

#### DELETE 路由
- `[v0:task:delete]` - 删除操作启动
- `[v0:task:delete:error]` - 删除失败
- `[v0:task:delete:complete]` - 删除成功

#### Sora 内容获取（fetchSoraContent）
- `[v0:sora:content:fetch]` - 开始获取
- `[v0:sora:content:error]` - 获取失败
- `[v0:sora:content:parsed]` - 解析响应
- `[v0:sora:content:extracted]` - 提取的 URL 数量

#### 轮询函数（maybePollVideoTask）
- `[v0:poll:throttle]` - 节流中，距离下次轮询的时间
- `[v0:poll:trigger]` - 触发轮询（提供商名称）
- `[v0:poll:error:gateway]` - 网关配置错误
- `[v0:poll:error:upstream]` - 上游轮询失败
- `[v0:poll:success]` - 任务成功
- `[v0:poll:sora:fetch-content]` - 开始获取 Sora 内容
- `[v0:poll:sora:content-ok]` - Sora 内容获取成功
- `[v0:poll:sora:content-failed]` - Sora 内容获取失败（但不影响）
- `[v0:poll:failed]` - 任务失败
- `[v0:poll:running]` - 任务继续运行
- `[v0:poll:db-update]` - 数据库更新结果

## 日志特点

### 1. 结构化和可追踪
- 所有日志使用统一前缀 `[v0:module:action]`
- 每条日志包含 `key=value` 格式的上下文信息
- 任务ID、用户ID 等关键标识符保持一致

### 2. 性能可见性
- 记录所有网络调用的 `duration=XXXms`
- 可以快速识别瓶颈操作
- 支持性能分析和优化

### 3. 错误诊断
- 详细的错误信息和错误源
- 错误链路清晰（e.g., 模型 → 网关 → 生成失败）
- 区分不同类型的失败（模型、配置、网络、上游）

### 4. Sora 特定支持
- 专门的 `[v0:sora:*]` 日志用于 Sora 内容获取
- 完整的内容获取失败恢复流程
- 清晰的 Sora 特定操作追踪

## 类型安全

所有日志代码都已通过 TypeScript 类型检查，特别处理了：
- 并集类型（ParsedResponse 和 PollResult）的条件日志
- 避免访问可能不存在的属性
- 正确的类型守卫

## 使用建议

### 开发环境
- 启用所有日志级别
- 使用 `grep` 和 `tail` 实时监控
- 参考 `LOGGING_QUICK_REFERENCE.md` 进行故障排查

### 测试环境
- 保留所有日志用于质量保证
- 收集性能基准数据
- 验证错误处理流程

### 生产环境
- 保留 error 和 warning 级别日志
- 可以过滤或禁用 parsed/complete 详细日志
- 使用日志聚合工具（如 DataDog、Splunk）进行监控

## 相关文档

- `LOGGING_GUIDE.md` - 详细的日志说明和最佳实践
- `LOGGING_QUICK_REFERENCE.md` - 快速参考和常见命令

## 代码修改统计

| 文件 | 添加行数 | 修改函数数 |
|-----|---------|-----------|
| lib/ai-provider.ts | ~100 | 6 |
| app/api/tasks/route.ts | ~35 | 1 |
| app/api/tasks/[id]/route.ts | ~80 | 4 |
| **总计** | **~215** | **11** |

所有修改都是添加日志，不改变任何业务逻辑，完全向后兼容。
