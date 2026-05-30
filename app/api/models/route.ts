import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const modelType = searchParams.get('type') // 'video', 'image', 'music'

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

    return NextResponse.json(
      {
        data: models.map((m) => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          desc: m.description || `${m.provider} 提供的 AI 模型`,
          price: m.cost_per_use,
          config: m.config,
          modelType: m.model_type,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (err) {
    console.error('[v0] Get models error:', err)
    return NextResponse.json({ error: '获取模型列表失败' }, { status: 500 })
  }
}
