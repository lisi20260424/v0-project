import { getModels } from '@/lib/get-models'
import { VideoGenerator } from './video-generator'

/**
 * Server Component - 从数据库获取启用的视频生成模型
 */
export async function VideoGeneratorServer() {
  const models = await getModels('video')

  // 转换为组件期望的格式
  const generatorModels = models.map((m) => ({
    id: m.id,
    name: m.name,
    tag: m.provider === '新' ? '新' : undefined,
    desc: m.desc,
    price: m.price,
  }))

  // 提供默认 mock 数据作为后备
  const defaultModels = generatorModels.length
    ? generatorModels
    : [
        {
          id: 'sora',
          name: 'Sora',
          tag: '新',
          desc: '超强文生视频，业界天花板级能力',
          price: 10,
        },
        {
          id: 'kling',
          name: 'Kling 2.0',
          desc: '写实感强，中国团队优化，本土化友好',
          price: 8,
        },
        {
          id: 'veo',
          name: 'Veo 2',
          desc: '谷歌进阶版本，支持 8K 超高分辨率',
          price: 12,
        },
      ]

  return (
    <VideoGenerator
      models={defaultModels}
      defaultModelId={defaultModels[0]?.id}
      ratios={[
        { id: '169', label: '16:9', ratio: '16:9' },
        { id: '916', label: '9:16', ratio: '9:16' },
        { id: '11', label: '1:1', ratio: '1:1' },
        { id: '21', label: '21:9', ratio: '21:9' },
      ]}
      durations={[
        { id: '5', label: '5 秒' },
        { id: '10', label: '10 秒' },
        { id: '30', label: '30 秒' },
        { id: '60', label: '60 秒' },
      ]}
      supportsImageToVideo={true}
      imageCapability="frames"
      multiImageSlots={4}
    />
  )
}
