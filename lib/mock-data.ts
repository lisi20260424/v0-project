export type TaskStatus = "queued" | "running" | "success" | "failed"
export type TaskType = "video" | "image" | "audio" | "chat"

export type Task = {
  id: string
  type: TaskType
  tool: string
  prompt: string
  status: TaskStatus
  progress?: number // 0-100 when running
  cost: number
  createdAt: string
  duration?: string
  thumbnail?: string
  errorMsg?: string
}

export const MOCK_TASKS: Task[] = [
  {
    id: "T-2026042401",
    type: "video",
    tool: "Veo 3.1 · 文生视频",
    prompt: "电影感空镜头，夕阳下的东京涩谷十字路口，人流车流交错，霓虹灯开始点亮，浅景深，35mm 胶片质感",
    status: "running",
    progress: 62,
    cost: 30,
    createdAt: "2026-04-24 14:32:08",
    duration: "预计 1 分 20 秒",
  },
  {
    id: "T-2026042402",
    type: "image",
    tool: "Nano Banana · 图生图",
    prompt: "把上传的产品照片放到白色大理石台面上，侧面柔光，旁边点缀绿植和金属装饰，极简高级感",
    status: "queued",
    cost: 5,
    createdAt: "2026-04-24 14:30:55",
    duration: "前方还有 2 个任务",
  },
  {
    id: "T-2026042403",
    type: "video",
    tool: "Sora 2 · 图生视频",
    prompt: "以这张照片为起始帧，人物缓慢转头微笑，镜头向后拉远，背景散景虚化",
    status: "success",
    cost: 25,
    createdAt: "2026-04-24 13:58:21",
    duration: "用时 1 分 12 秒",
    thumbnail: "/showcase/anime-girl.jpg",
  },
  {
    id: "T-2026042404",
    type: "audio",
    tool: "Suno V5 · 文生音乐",
    prompt: "一首夏日城市流行电音，女声清亮，副歌上扬，鼓点轻快，适合 vlog 背景音乐",
    status: "success",
    cost: 8,
    createdAt: "2026-04-24 11:12:03",
    duration: "2 分 18 秒",
    thumbnail: "/suno-covers/cover-2.jpg",
  },
  {
    id: "T-2026042405",
    type: "image",
    tool: "GPT-Image 2 · 文生图",
    prompt: "一只可爱的柯基犬，穿着宇航员服装，漂浮在星空中，卡通渲染风格，正方形构图",
    status: "success",
    cost: 4,
    createdAt: "2026-04-24 10:45:17",
    duration: "用时 18 秒",
    thumbnail: "/image-samples/sample-4.jpg",
  },
  {
    id: "T-2026042306",
    type: "video",
    tool: "可灵 2.0 · 文生视频",
    prompt: "一只赛博朋克风格的机械猫在雨夜霓虹街道上奔跑，慢动作，镜头跟随",
    status: "failed",
    cost: 0,
    createdAt: "2026-04-23 22:08:44",
    errorMsg: "提示词包含敏感内容，已自动退回点数",
  },
  {
    id: "T-2026042307",
    type: "video",
    tool: "Veo 3.1 · 图生视频",
    prompt: "以上传图为起始帧，相机缓慢向前推进，人物发丝随风飘动，电影级运镜",
    status: "success",
    cost: 30,
    createdAt: "2026-04-23 19:33:01",
    duration: "用时 1 分 48 秒",
    thumbnail: "/showcase/clay-girl.jpg",
  },
  {
    id: "T-2026042308",
    type: "chat",
    tool: "AI 对话 · Claude Opus",
    prompt: "帮我把这份英文产品白皮书翻译成中文，要求地道通顺并保留原排版",
    status: "success",
    cost: 2,
    createdAt: "2026-04-23 16:22:15",
    duration: "用时 42 秒",
  },
]

export type Creation = {
  id: string
  type: TaskType
  tool: string
  title: string
  prompt: string
  cover: string
  createdAt: string
  duration?: string
  liked?: boolean
  public?: boolean
}

export const MOCK_CREATIONS: Creation[] = [
  {
    id: "C-0001",
    type: "video",
    tool: "Veo 3.1",
    title: "粘土风格女孩登山",
    prompt: "3D 粘土风格小女孩，橙色发带，攀登由草莓和芒果堆成的山",
    cover: "/showcase/clay-girl.jpg",
    createdAt: "2026-04-24",
    duration: "5s · 1080P",
    liked: true,
    public: true,
  },
  {
    id: "C-0002",
    type: "video",
    tool: "Sora 2",
    title: "雪夜小镇小狐狸",
    prompt: "粘土风雪夜小镇，穿白色外套的小狐狸走在雪地里",
    cover: "/showcase/clay-fox.jpg",
    createdAt: "2026-04-23",
    duration: "10s · 4K",
    public: true,
  },
  {
    id: "C-0003",
    type: "video",
    tool: "可灵 2.0",
    title: "赛博朋克雨夜",
    prompt: "赛博朋克雨夜街头，黑色机能风男人手持全息平板",
    cover: "/showcase/cyberpunk.jpg",
    createdAt: "2026-04-22",
    duration: "8s · 1080P",
    liked: true,
  },
  {
    id: "C-0004",
    type: "image",
    tool: "GPT-Image 2",
    title: "赛博朋克女侠",
    prompt: "电影感人像，旗袍女孩在上海霓虹夜色的弄堂里",
    cover: "/image-samples/sample-1.jpg",
    createdAt: "2026-04-22",
    liked: true,
    public: true,
  },
  {
    id: "C-0005",
    type: "image",
    tool: "Nano Banana",
    title: "晨光咖啡杯",
    prompt: "极简产品摄影，木桌上的陶瓷咖啡杯，晨光侧逆",
    cover: "/image-samples/sample-2.jpg",
    createdAt: "2026-04-21",
  },
  {
    id: "C-0006",
    type: "image",
    tool: "Flux",
    title: "浮空小屋",
    prompt: "等距视角 3D 插画，漂浮岛屿上的温馨小屋",
    cover: "/image-samples/sample-3.jpg",
    createdAt: "2026-04-20",
    public: true,
  },
  {
    id: "C-0007",
    type: "image",
    tool: "GPT-Image 2",
    title: "涅槃凤凰",
    prompt: "橙金色羽毛的凤凰从火焰中涅槃升起",
    cover: "/image-samples/sample-4.jpg",
    createdAt: "2026-04-19",
  },
  {
    id: "C-0008",
    type: "audio",
    tool: "Suno V5",
    title: "城市夜行",
    prompt: "Lo-fi Hip Hop 风格，都市夜晚氛围感背景乐",
    cover: "/suno-covers/cover-1.jpg",
    createdAt: "2026-04-19",
    duration: "2:45",
    liked: true,
  },
  {
    id: "C-0009",
    type: "audio",
    tool: "Suno V5",
    title: "霓虹心跳",
    prompt: "高能电子舞曲，粉红与青色流体质感",
    cover: "/suno-covers/cover-2.jpg",
    createdAt: "2026-04-18",
    duration: "2:18",
  },
  {
    id: "C-0010",
    type: "audio",
    tool: "Suno V5",
    title: "山间独行",
    prompt: "民谣原声，暖色秋山水彩插画配乐",
    cover: "/suno-covers/cover-3.jpg",
    createdAt: "2026-04-17",
    duration: "3:02",
    public: true,
  },
  {
    id: "C-0011",
    type: "video",
    tool: "Sora 2",
    title: "深海游弋",
    prompt: "电影级航拍，游艇在海面上划开浪花",
    cover: "/showcase/ocean.jpg",
    createdAt: "2026-04-16",
    duration: "10s · 4K",
  },
  {
    id: "C-0012",
    type: "video",
    tool: "Veo 3.1",
    title: "星海漫游",
    prompt: "宇航员漂浮在地球上方星云背景",
    cover: "/showcase/astronaut.jpg",
    createdAt: "2026-04-15",
    duration: "8s · 1080P",
    liked: true,
    public: true,
  },
]
