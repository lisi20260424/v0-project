import { createClient } from '@/lib/supabase/server'

export type Model = {
  id: string
  name: string
  provider: string
  desc: string
  price: number
  config: Record<string, unknown>
  modelType: 'video' | 'image' | 'music'
}

/**
 * 从数据库获取启用的模型列表
 * @param modelType - 模型类型：video/image/music，不指定则获取所有
 */
export async function getModels(modelType?: 'video' | 'image' | 'music'): Promise<Model[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('admin_models')
      .select('id, name, provider, model_type, cost_per_use, description, config')
      .eq('enabled', true)

    if (modelType) {
      query = query.eq('model_type', modelType)
    }

    const { data: models, error } = await query.order('sort_order', { ascending: true })

    if (error) throw error

    return (
      models?.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        desc: m.description || `${m.provider} 提供的 AI 模型`,
        price: m.cost_per_use,
        config: m.config || {},
        modelType: m.model_type as 'video' | 'image' | 'music',
      })) || []
    )
  } catch (err) {
    console.error('[v0] Get models error:', err)
    // 降级方案：返回空列表，组件会使用 mock 数据
    return []
  }
}
