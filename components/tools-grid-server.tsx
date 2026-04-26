import { Suspense } from 'react'
import { ToolsGrid } from '@/components/tools-grid'
import type { Tool } from '@/lib/tools'
import { createAdminClient } from '@/lib/supabase/admin'

async function ToolsGridContent() {
  try {
    const admin = createAdminClient()
    
    // 获取所有启用的模型
    const { data: models, error } = await admin
      .from('admin_models')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('[v0] 获取模型失败:', error)
      return <ToolsGrid />
    }

    if (!models || models.length === 0) {
      return <ToolsGrid />
    }

    // 按 model_type 分组
    const groupedByType: Record<string, any[]> = {}
    for (const model of models) {
      if (!groupedByType[model.model_type]) {
        groupedByType[model.model_type] = []
      }
      groupedByType[model.model_type].push(model)
    }

    // 转换为 TOOLS 格式
    const tools: Tool[] = []
    const categoryMap: Record<string, 'video' | 'image' | 'audio'> = {
      video: 'video',
      image: 'image',
      music: 'audio',
    }
    const accentMap: Record<string, string> = {
      video: 'from-sky-500/30 to-indigo-500/10',
      image: 'from-violet-500/30 to-fuchsia-500/10',
      music: 'from-cyan-500/30 to-blue-500/10',
    }

    for (const [modelType, modelList] of Object.entries(groupedByType)) {
      const category = categoryMap[modelType] || 'video'
      
      for (const model of modelList) {
        tools.push({
          id: model.id,
          name: model.name,
          brand: model.provider,
          desc: model.description || '',
          href: getCategoryHref(category, model.id),
          category: category,
          icon: getIconForModel(modelType),
          accent: accentMap[modelType] || 'from-primary/30 to-accent/10',
          cost: `${model.cost_per_use} 点起`,
        })
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
