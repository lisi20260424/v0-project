import { getModels } from '@/lib/get-models'
import { MusicGenerator } from './music-generator'

/**
 * Server Component - 从数据库获取启用的音乐生成模型
 */
export async function MusicGeneratorServer() {
  const models = await getModels('music')

  // 转换为组件期望的格式
  const generatorModels = models.map((m) => ({
    id: m.id,
    name: m.name,
    desc: m.desc,
    price: m.price,
    tag: m.provider === 'Suno' && m.name.includes('V5') ? '新' : undefined,
  }))

  // 提供默认 mock 数据作为后备
  const defaultModels = generatorModels.length
    ? generatorModels
    : [
        {
          id: 'v4',
          name: 'Suno V4',
          tag: undefined,
          desc: '经典稳定，速度快',
          price: 5,
        },
        {
          id: 'v5',
          name: 'Suno V5',
          tag: '新',
          desc: '人声更真实，支持 4 分钟长曲',
          price: 8,
        },
      ]

  return <MusicGenerator models={defaultModels} defaultModelId={defaultModels[0]?.id} />
}
