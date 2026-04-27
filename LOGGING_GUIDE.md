# AI 生成链路日志指南

## 概述

为了帮助调试和监控 AI 生成流程，已在整个生成链路中添加了详细的结构化日志。所有日志都使用 `[v0:...]` 前缀进行标记，便于过滤和搜索。

## 日志级别与前缀

| 前缀 | 说明 | 示例 |
|------|------|------|
| `[v0:gateway:*]` | AI 网关调用 | 请求/响应/错误 |
| `[v0:poll:*]` | 视频任务轮询 | 状态查询/更新 |
| `[v0:sora:*]` | Sora 特定操作 | 内容获取 |
| `[v0:task:*]` | 任务生命周期 | 创建/查询/删除 |
| `[v0:model:*]` | 模型查询 | 获取模型信息 |
| `[v0:endpoint:*]` | 端点配置 | 端点解析 |

## 完整流程追踪示例

### 1. 任务创建流程

```
[v0:task:create:start] user=abc123... | type=video | modelId=xxx | prompt=...
  ↓
[v0:model:fetch] modelId=xxx
[v0:model:found] name=Sora | provider=sora | type=video
  ↓
[v0:endpoint:fetch] provider=sora | type=video
[v0:endpoint:resolved] path=/v1/videos | format=sora | pollPath=yes | contentPath=yes
  ↓
[v0:task:create:insert] creating task...
[v0:task:create:inserted] taskId=abc123...
  ↓
[v0:gateway:config] url=https://api.example.com | apiKey=sk_***
  ↓
[v0:gateway:start] video | format=sora | model=gpt-4-vision
[v0:gateway:request] POST https://api.example.com/v1/videos
[v0:gateway:body] {...request body...}
[v0:gateway:response] status=200 | duration=1234ms
[v0:gateway:parsed] kind=async | providerTaskId=task_xyz
  ↓
[v0:task:create:async:submitted] taskId=abc123... | providerTaskId=task_xyz
```

### 2. 视频任务轮询流程

```
[v0:task:get] taskId=abc123... | user=user_id...
  ↓
[v0:poll:trigger] taskId=abc123... | provider=sora
[v0:poll:start] format=sora | taskId=task_xyz | url=.../v1/videos/task_xyz
[v0:poll:response] status=200 | duration=567ms
[v0:poll:parsed] status=running | progress=45
  ↓
[v0:poll:db-update] taskId=abc123... | updated=true
[v0:task:get:complete] status=running | progress=45
```

### 3. 视频完成 + Sora 内容获取

```
[v0:poll:trigger] taskId=abc123... | provider=sora
[v0:poll:response] status=200 | duration=567ms
[v0:poll:parsed] status=success | urls=1
  ↓
[v0:poll:success] taskId=abc123... | urls=1
[v0:poll:sora:fetch-content] taskId=abc123...
[v0:sora:content:fetch] url=https://api.example.com/v1/videos/task_xyz/content
[v0:sora:content:parsed] response keys=url, size, duration...
[v0:sora:content:extracted] urls=1
[v0:poll:sora:content-ok] urls=1
  ↓
[v0:poll:db-update] taskId=abc123... | updated=true
```

### 4. 错误处理

#### 网关调用失败
```
[v0:gateway:start] video | format=sora | model=sora
[v0:gateway:request] POST https://api.example.com/v1/videos
[v0:gateway:response] status=400 | duration=234ms
[v0:gateway:error] API Gateway Error (400): sora-2 size is invalid
[v0:task:create:error:generation] taskId=abc123... | API Gateway Error (400): ...
```

#### 模型不可用
```
[v0:task:create:start] user=abc123... | type=video | modelId=xxx
[v0:model:fetch] modelId=xxx
[v0:model:error] Model not found: xxx
[v0:task:create:error:model] Model not found: xxx
```

#### 网关配置缺失
```
[v0:gateway:config] fetching...
[v0:gateway:config:error] Gateway settings incomplete: 请先在系统设置中配置网关 URL 与 API Key
[v0:task:create:error:gateway] Gateway settings incomplete: ...
```

## 日志搜索技巧

### 查找特定任务的完整生命周期
```
grep "\[v0:task:create:start\].*model=MODEL_ID" logs.txt
grep "taskId=ABC123" logs.txt | sort
```

### 查找所有失败的生成
```
grep "\[v0:.*:error\]" logs.txt
grep "\[v0:gateway:error\]" logs.txt
```

### 查找轮询相关日志
```
grep "\[v0:poll" logs.txt
grep "\[v0:poll:sora" logs.txt
```

### 按时间顺序追踪完整流程
```
tail -f logs.txt | grep "\[v0:"
```

## 关键指标提取

从日志中可以提取以下关键指标：

| 指标 | 查找方式 | 示例 |
|------|----------|------|
| 网关响应时间 | `[v0:gateway:response] status=200 \| duration=1234ms` | 1234ms |
| 轮询时间 | `[v0:poll:response] ... \| duration=567ms` | 567ms |
| 任务最终状态 | `[v0:poll:success\|failed]` | success 或 failed |
| 视频生成进度 | `[v0:poll:running] ... \| progress=45` | 45% |
| 内容获取成功率 | `[v0:poll:sora:content-ok]` vs `[v0:poll:sora:content-failed]` | 比例 |

## 日志级别说明

### 日志消息结构
每条日志遵循格式：`[v0:module:action:status] key1=value1 | key2=value2`

- `module`: 生成链路的模块（gateway, poll, sora, task, model, endpoint）
- `action`: 具体操作（start, request, response, parsed, success, failed, error 等）
- `status`: 可选的状态指示
- `key=value`: 重要的上下文信息

### 常见日志分类

**启动日志**（:start）
- 表示某个操作开始
- 包含初始参数

**进行日志**（:request, :fetch, :trigger）
- 表示正在进行的操作
- 包含关键参数（URL、ID等）

**完成日志**（:response, :parsed, :complete）
- 表示操作完成
- 包含结果摘要

**错误日志**（:error, :failed, :warning）
- 表示出错或警告
- 包含错误信息

## 性能分析

### 检查瓶颈
```bash
# 找出耗时最长的网关调用
grep "\[v0:gateway:response\]" logs.txt | awk -F'duration=' '{print $2}' | sort -n | tail -10

# 找出轮询频率
grep "\[v0:poll:throttle\]" logs.txt | wc -l
```

### 检查重试频率
```bash
# 查看 Sora 内容获取失败次数
grep "\[v0:poll:sora:content-failed\]" logs.txt | wc -l
```

## 故障排查清单

按这个顺序检查日志，快速定位问题：

1. **任务创建**：查看 `[v0:task:create:*]` 日志
2. **模型查询**：检查 `[v0:model:*]` 日志
3. **端点配置**：检查 `[v0:endpoint:*]` 日志
4. **网关配置**：检查 `[v0:gateway:config*]` 日志
5. **网关调用**：检查 `[v0:gateway:*]` 日志
6. **轮询过程**：检查 `[v0:poll:*]` 日志
7. **Sora 特定**：检查 `[v0:sora:*]` 日志（如使用Sora）

## 开发中的日志清理

在生产环境部署前，建议：
- 保留所有 `[v0:*:error]` 和 `[v0:*:warning]` 日志
- 可以移除 `[v0:*:parsed]` 和 `[v0:*:complete]` 等详细日志
- 使用环境变量控制日志级别（如有需要）

## 示例：完整故障排查

假设用户报告"视频生成失败"：

```bash
# 1. 找到任务ID
taskId=$(grep "user=USER_ID" logs.txt | grep "\[v0:task:create" | tail -1 | grep -o 'taskId=[^ ]*' | cut -d= -f2)

# 2. 查看任务完整日志
grep "$taskId" logs.txt

# 3. 查找错误
grep "$taskId" logs.txt | grep -i error

# 4. 查看网关错误
grep "$taskId" logs.txt | grep "\[v0:gateway"
```
