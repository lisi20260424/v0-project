"use client"

import * as React from "react"
import {
  Send,
  Sparkles,
  MessageSquare,
  Plus,
  Paperclip,
  Globe,
  Image as ImageIcon,
  Code,
  Mic,
  Bot,
  User as UserIcon,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Msg = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string
}

const MODELS = [
  { id: "gpt-5", name: "GPT-5", vendor: "OpenAI", desc: "综合能力最强", cost: "0.15 点/千字" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", vendor: "OpenAI", desc: "轻量快速，性价比高", cost: "0.03 点/千字" },
  { id: "claude-opus-4", name: "Claude Opus 4.6", vendor: "Anthropic", desc: "长文档与编码王者", cost: "0.12 点/千字" },
  { id: "gemini-3", name: "Gemini 3 Flash", vendor: "Google", desc: "多模态速度冠军", cost: "0.05 点/千字" },
  { id: "deepseek", name: "DeepSeek V3", vendor: "深度求索", desc: "中文能力顶尖", cost: "0.02 点/千字" },
]

const QUICK_ACTIONS = [
  { icon: Globe, label: "实时联网搜索" },
  { icon: ImageIcon, label: "理解图片内容" },
  { icon: Code, label: "帮我写代码" },
  { icon: Mic, label: "语音对话" },
]

const STARTER_PROMPTS = [
  "帮我写一份公司年会主持稿，时长 10 分钟，幽默风趣",
  "把这段 React 组件改成 Vue 3 Composition API 写法",
  "总结近 3 个月全球 AI 领域重要进展，输出脑图大纲",
  "给我推荐一个 7 天北海道冬日自由行路线",
]

const HISTORY = [
  { id: "h1", title: "React 组件性能优化方案", time: "今天" },
  { id: "h2", title: "小红书爆款文案 10 条", time: "今天" },
  { id: "h3", title: "PRD 文档模板生成", time: "昨天" },
  { id: "h4", title: "Python 数据清洗脚本", time: "昨天" },
  { id: "h5", title: "日语 N2 语法 30 条", time: "3 天前" },
]

export function ChatInterface() {
  const [model, setModel] = React.useState("gpt-5")
  const [input, setInput] = React.useState("")
  const [msgs, setMsgs] = React.useState<Msg[]>([])
  const [sending, setSending] = React.useState(false)

  const currentModel = MODELS.find((m) => m.id === model)!

  const send = (text: string) => {
    const content = text.trim()
    if (!content || sending) return
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content }
    setMsgs((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)

    setTimeout(() => {
      const reply: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        model: currentModel.name,
        content:
          "收到！这是一个演示回复。我可以帮你完成写作、编程、翻译、数据分析、长文档总结、脑图大纲、海报文案等任务。\n\n在真实场景中，灵境 AI 会把你的请求转发到「" +
          currentModel.name +
          "」，并以流式返回结果。你可以随时切换到上方下拉列表中的其他模型对比效果。",
      }
      setMsgs((prev) => [...prev, reply])
      setSending(false)
    }, 1200)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden rounded-2xl border border-border bg-card p-3 lg:block">
        <Button className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" />
          新建对话
        </Button>
        <div className="mt-4 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">历史会话</div>
        <ul className="mt-2 space-y-1">
          {HISTORY.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{h.title}</p>
                  <p className="text-[10px] text-muted-foreground">{h.time}</p>
                </div>
                <Trash2 className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <div className="flex min-h-[640px] flex-col rounded-2xl border border-border bg-card">
        {/* Model header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="cursor-pointer appearance-none rounded-md bg-transparent text-sm font-semibold outline-none"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentModel.vendor} · {currentModel.desc} · {currentModel.cost}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="更多">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {msgs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-border">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">你好，我是灵境 AI</h2>
                <p className="mt-1 text-sm text-muted-foreground">我可以为你写作、编程、翻译、分析、总结，随时开始吧</p>
              </div>

              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-xl border border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon
                  return (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      <Icon className="h-3 w-3 text-primary" />
                      {a.label}
                    </span>
                  )
                })}
              </div>
            </div>
          ) : (
            <ul className="mx-auto flex max-w-3xl flex-col gap-6">
              {msgs.map((m) => (
                <li
                  key={m.id}
                  className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground",
                    )}
                  >
                    {m.role === "assistant" && m.model && (
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {m.model}
                      </p>
                    )}
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </li>
              ))}
              {sending && (
                <li className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 md:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-3 focus-within:border-primary/50"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="输入你的问题，Shift + Enter 换行"
              className="min-h-[40px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              rows={1}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="上传附件">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="联网搜索">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="语音输入">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Button type="submit" size="sm" disabled={!input.trim() || sending} className="gap-1">
                <Send className="h-3.5 w-3.5" />
                发送
              </Button>
            </div>
          </form>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            内容由 AI 生成，仅供参考。请勿输入敏感个人信息。
          </p>
        </div>
      </div>
    </div>
  )
}
