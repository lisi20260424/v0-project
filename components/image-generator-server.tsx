import { getModels } from '@/lib/get-models'
import { ImageGenerator } from './image-generator'

/**
 * Server Component - 从数据库获取启用的图像生成模型
 */
export async function ImageGeneratorServer() {
  const models = await getModels('image')

  // 转换为组件期望的格式（需要 icon 和 brand）
  const generatorModels = models.map((m) => ({
    id: m.id,
    name: m.name,
    brand: m.provider,
    desc: m.desc,
    price: m.price,
    tag: m.provider === 'OpenAI' ? '新' : undefined,
  }))

  // 提供默认 mock 数据作为后备
  const defaultModels = generatorModels.length
    ? generatorModels
    : [
        {
          id: 'gpt-image',
          name: 'GPT-Image 2',
          brand: 'OpenAI',
          desc: '全新多模态，支持精准中文文字、海报、Logo 渲染。',
          price: 4,
          tag: '新',
        },
        {
          id: 'nano-banana',
          name: 'Nano Banana',
          brand: 'Google',
          desc: '交互式编辑，多图融合、局部重绘、风格迁移。',
          price: 5,
        },
        {
          id: 'flux',
          name: 'Flux 1.1',
          brand: 'Black Forest Labs',
          desc: '摄影级真实质感，艺术创作首选，开源顶级模型。',
          price: 3,
        },
      ]

  return <ImageGenerator models={defaultModels} defaultModelId={defaultModels[0]?.id} />
}
