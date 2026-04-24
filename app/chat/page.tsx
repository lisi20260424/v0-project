import type { Metadata } from "next"
import { ToolPageShell } from "@/components/tool-page-shell"
import { ChatInterface } from "@/components/chat-interface"

export const metadata: Metadata = {
  title: "AI 对话 · GPT-5 / Claude / Gemini · 灵境 AI",
  description: "主流大模型一键切换，支持联网搜索、图像理解、代码生成、长文档总结。",
}

export default function ChatPage() {
  return (
    <ToolPageShell toolId="chat">
      <ChatInterface />
    </ToolPageShell>
  )
}
