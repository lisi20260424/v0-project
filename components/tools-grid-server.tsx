'use client'

import { Suspense, useState, useEffect } from 'react'
import { ToolsGrid } from '@/components/tools-grid'
import type { Tool } from '@/lib/tools'

async function ToolsGridContent() {
  try {
    const res = await fetch('/api/models/grouped', { cache: 'revalidate' })
    const data = await res.json()
    
    if (!data.grouped || Object.keys(data.grouped).length === 0) {
      return <ToolsGrid />
    }

    // 将分组数据转换为 TOOLS 格式
    const tools: Tool[] = []
    const categoryMap: Record<string, 'video' | 'image' | 'audio'> = {
      video: 'video',
      image: 'image',
      music: 'audio',
    }
    const iconMap: Record<string, any> = {
      video: 'Video',
      image: 'ImageIcon',
      music: 'Music2',
    }
    const accentMap: Record<string, string> = {
      video: 'from-sky-500/30 to-indigo-500/10',
      image: 'from-violet-500/30 to-fuchsia-500/10',
      music: 'from-cyan-500/30 to-blue-500/10',
    }

    // 遍历分组数据，按供应商聚合
    for (const [modelType, groupData] of Object.entries(data.grouped)) {
      const category = categoryMap[modelType] || 'video'
      
      for (const [provider, providerData] of Object.entries(groupData.providers || {})) {
        const models = (providerData as any).models || []
        
        // 每个供应商下的模型都转换为 Tool 对象
        for (const model of models) {
          tools.push({
            id: model.id,
            name: model.name,
            brand: provider,
            desc: model.description || '',
            href: getCategoryHref(category, model.id),
            category: category,
            icon: getIconForModel(modelType),
            accent: accentMap[modelType] || 'from-primary/30 to-accent/10',
            cost: `${model.cost_per_use} 点起`,
          })
        }
      }
    }

    return <ToolsGrid models={tools} />
  } catch (error) {
    console.error('[v0] 加载模型数据失败:', error)
    return <ToolsGrid />
  }
}

function getCategoryHref(category: string, modelId: string): string {
  const modelPageMap: Record<string, string> = {
    'sora': '/sora',
    'kling': '/kling',
    'veo': '/veo',
    'grok': '/grok',
    'gpt-image': '/image',
    'nano-banana': '/image?model=nano-banana',
    'flux': '/image?model=flux',
    'suno': '/suno',
  }
  return modelPageMap[modelId] || `/${category}/${modelId}`
}

function getIconForModel(type: string) {
  const icons: Record<string, any> = {
    video: 'Video',
    image: 'ImageIcon',
    music: 'Music2',
  }
  return icons[type] || 'Sparkles'
}

export function ToolsGridServer() {
  return (
    <Suspense fallback={<ToolsGrid />}>
      <ToolsGridContent />
    </Suspense>
  )
}
