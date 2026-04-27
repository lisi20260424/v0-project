# AI 生成链路日志快速参考

## 主要日志前缀

```
[v0:gateway:*]     - AI 网关调用        POST /v1/videos/generations 等
[v0:poll:*]        - 视频任务轮询      GET /v1/videos/{taskId} 等  
[v0:sora:*]        - Sora 特定操作     获取视频内容等
[v0:task:*]        - 任务生命周期      创建/查询/删除任务
[v0:model:*]       - 模型查询          从数据库获取模型信息
[v0:endpoint:*]    - 端点配置          API 路径和格式解析
```

## 生成流程中的关键日志

| 阶段 | 日志 | 说明 |
|------|------|------|
| 请求 | `[v0:task:create:start]` | 用户发起生成请求 |
| 验证 | `[v0:model:fetch]` + `[v0:model:found]` | 模型存在且启用 |
| 配置 | `[v0:endpoint:resolved]` | 使用的 API 端点和格式 |
| 网关 | `[v0:gateway:start]` | 准备调用网关 |
| 请求 | `[v0:gateway:request]` | 发送请求 |
| 响应 | `[v0:gateway:response]` | 收到响应（status + duration） |
| 结果 | `[v0:gateway:parsed]` | 解析响应（kind=sync/async/binary） |

## 常见错误日志

```
[v0:model:error]              模型不存在或被禁用
[v0:gateway:config:error]     网关配置不完整
[v0:gateway:error]            API 返回错误（检查错误信息）
[v0:poll:error:upstream]      轮询上游 API 失败
[v0:sora:content:error]       Sora 内容获取失败
```

## 视频轮询日志序列

```
[v0:poll:trigger]          开始轮询
[v0:poll:throttle]         节流中（2s 内不轮询）
[v0:poll:response]         收到上游响应
[v0:poll:parsed]           解析状态
[v0:poll:running]          还在执行中 → progress
[v0:poll:success]          完成 → urls 数量
[v0:poll:failed]           失败 → error 信息
[v0:poll:db-update]        数据库更新结果
```

## 快速调试命令

### 查看最后一个任务的完整流程
```bash
tail -100 /path/to/logs.txt | grep "\[v0:" | tail -30
```

### 查看特定用户的所有生成
```bash
grep "user=USER_ID_PREFIX" /path/to/logs.txt | grep "\[v0:task"
```

### 统计各阶段的性能
```bash
grep "\[v0:gateway:response\]" /path/to/logs.txt | \
  awk -F'duration=' '{sum+=$2; count++} END {print "avg ms: " int(sum/count)}'
```

### 查看最近的错误
```bash
grep "\[v0:.*:error\]" /path/to/logs.txt | tail -10
```

### 查看 Sora 相关日志
```bash
grep "\[v0:sora\|provider=sora" /path/to/logs.txt
```

## 日志格式示例

### 成功的图片生成
```
[v0:task:create:start] user=abc... | type=image | modelId=dall-e-3 | prompt=a cat...
[v0:model:found] name=DALL-E 3 | provider=openai | type=image
[v0:gateway:start] image | format=openai | model=dall-e-3
[v0:gateway:response] status=200 | duration=2456ms
[v0:gateway:parsed] kind=sync | urls=1
[v0:task:create:sync:complete] taskId=abc... | urls=1
```

### 异步视频生成 + 轮询
```
[v0:task:create:start] user=abc... | type=video | modelId=sora | prompt=a dancing bear...
[v0:gateway:parsed] kind=async | providerTaskId=task_xyz
[v0:task:create:async:submitted] taskId=abc... | providerTaskId=task_xyz

(30秒后)
[v0:poll:trigger] taskId=abc... | provider=sora
[v0:poll:parsed] status=running | progress=45
[v0:poll:db-update] taskId=abc... | updated=true

(60秒后)
[v0:poll:trigger] taskId=abc... | provider=sora
[v0:poll:parsed] status=success | urls=1
[v0:poll:sora:fetch-content] taskId=abc...
[v0:sora:content:extracted] urls=1
[v0:poll:db-update] taskId=abc... | updated=true
```

### 错误场景
```
[v0:task:create:start] user=abc... | type=video | modelId=xxx
[v0:model:fetch] modelId=xxx
[v0:model:error] Model not found: xxx
[v0:task:create:error:model] Model not found: xxx
```

## 性能基准

| 操作 | 预期耗时 | 过高告警 |
|------|---------|---------|
| 网关请求（图片） | 1-5s | >10s |
| 网关请求（视频）创建 | 1-3s | >10s |
| 轮询延迟 | <100ms | >500ms |
| DB 更新 | <10ms | >100ms |

## 注意事项

1. **任务ID 过长**：日志中只显示前 8 字符，完整 ID 从数据库查
2. **性能监控**：关注 `duration=` 字段，识别慢操作
3. **错误恢复**：轮询失败不会中断，会继续尝试
4. **Sora 特殊性**：如果看到 `[v0:sora:content-failed]` 但任务最终成功，说明回退到了轮询 URL
