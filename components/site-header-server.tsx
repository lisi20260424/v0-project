'use client'

import { Suspense } from 'react'
import { getModels } from '@/lib/get-models'
import { SiteHeader } from '@/components/site-header'
import type { Tool } from '@/lib/tools'

async function SiteHeaderContent() {
  const models = await getModels()
  
  // 转换 models 为 TOOLS 格式
  let tools: Tool[] | undefined = undefined
  if (models.length > 0) {
    tools = models.map((m) => {
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
        href: getCategoryHref(m.id),
        category: categoryMap[m.modelType] || 'chat' as const,
        icon: getIconForModel(m.modelType),
        accent: getAccentForModel(m.modelType),
        cost: `${m.price} 点起`,
        tag: undefined,
      } as Tool
    })
  }

  return <SiteHeader models={tools} />
}

function getCategoryHref(modelId: string): string {
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

export function SiteHeaderServer() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <SiteHeaderContent />
    </Suspense>
  )
}
