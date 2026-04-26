'use client'

import { Suspense } from 'react'
import { getModels } from '@/lib/get-models'
import { ToolsGrid } from '@/components/tools-grid'

async function ToolsGridContent() {
  const models = await getModels()
  
  // 如果数据库中没有模型，返回 null，tools-grid 会使用 mock 数据
  if (models.length === 0) {
    return <ToolsGrid />
  }

  // 转换 models 为 TOOLS 格式
  const tools = models.map((m) => {
    const categoryMap: Record<string, 'video' | 'image' | 'audio' | 'chat'> = {
      video: 'video',
      image: 'image',
      music: 'audio',
    }
    
    return {
      id: m.id,
      name: m.name,
      brand: m.provider,
      desc: m.desc,
      href: getCategoryHref(categoryMap[m.modelType] || 'chat', m.id),
      category: categoryMap[m.modelType] || 'chat' as const,
      icon: getIconForModel(m.modelType),
      accent: getAccentForModel(m.modelType),
      cost: `${m.price} 点起`,
    }
  })

  return <ToolsGrid models={tools} />
}

function getCategoryHref(category: string, modelId: string): string {
  // 根据模型 ID 返回对应的页面 URL
  const modelPageMap: Record<string, string> = {
    'sora': '/sora',
    'kling': '/kling',
    'veo': '/veo',
    'grok': '/grok',
    'gpt-image': '/image',
    'nano-banana': '/image?model=nano-banana',
    'flux': '/image?model=flux',
    'suno': '/suno',
    'chat': '/chat',
  }
  return modelPageMap[modelId] || `/${modelId}`
}

function getIconForModel(type: string) {
  const icons: Record<string, any> = {
    video: 'Video',
    image: 'ImageIcon',
    music: 'Music2',
    chat: 'MessageSquare',
  }
  return icons[type] || 'Sparkles'
}

function getAccentForModel(type: string): string {
  const accents: Record<string, string> = {
    video: 'from-sky-500/30 to-indigo-500/10',
    image: 'from-violet-500/30 to-fuchsia-500/10',
    music: 'from-cyan-500/30 to-blue-500/10',
    chat: 'from-primary/30 to-accent/10',
  }
  return accents[type] || 'from-primary/30 to-accent/10'
}

export function ToolsGridServer() {
  return (
    <Suspense fallback={<ToolsGrid />}>
      <ToolsGridContent />
    </Suspense>
  )
}
