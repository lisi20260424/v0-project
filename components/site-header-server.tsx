import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import type { Tool } from '@/lib/tools'
import { createClient } from '@/lib/supabase/server'

async function SiteHeaderContent() {
  try {
    const supabase = await createClient()
    
    // 获取所有启用的模型（依赖 RLS 策略 admin_models_select_enabled）
    const { data: models, error } = await supabase
      .from('admin_models')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('[v0] 获取模型失败:', error)
      return <SiteHeader />
    }

    if (!models || models.length === 0) {
      return <SiteHeader />
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

    for (const model of models) {
      const category = categoryMap[model.model_type] || 'video'
      
      tools.push({
        id: model.id,
        name: model.name,
        brand: model.provider,
        desc: model.description || '',
        href: getCategoryHref(category, model.id),
        category: category,
        icon: getIconForModel(model.model_type),
        accent: accentMap[model.model_type] || 'from-primary/30 to-accent/10',
        cost: `${model.cost_per_use} 点起`,
        tag: undefined,
      })
    }

    return <SiteHeader models={tools} />
  } catch (error) {
    console.error('[v0] 加载模型数据失败:', error)
    return <SiteHeader />
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

export function SiteHeaderServer() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <SiteHeaderContent />
    </Suspense>
  )
}
