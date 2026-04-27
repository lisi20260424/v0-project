/**
 * 比例到尺寸的映射关系
 * 根据用户选择的比例，转换为 API 调用所需的标准尺寸（NxN 格式）
 * 
 * 参考文档:
 * - 图片生成: https://docs.newapi.pro/zh/docs/api/ai-model/images/openai/post-v1-images-generations
 * - 视频生成: https://docs.newapi.pro/zh/docs/api/ai-model/videos/createvideogeneration
 */

/**
 * 图片生成尺寸映射
 * 基于用户选择的比例，返回对应的标准尺寸
 */
export const IMAGE_DIMENSION_MAP: Record<string, string> = {
  // 1:1 正方形
  "11": "1024x1024",

  // 9:16 竖屏 (手机壁纸、抖音)
  "916": "1024x1792",

  // 16:9 横屏 (电脑壁纸、封面)
  "169": "1792x1024",

  // 4:3 标准 (日常照片)
  "43": "1024x768",

  // 3:4 竖版 (小红书、图文配图)
  "34": "768x1024",

  // 2:1 宽幅 (banner、海报)
  "21": "1536x768",

  // 1:2 超长竖图 (长图描画)
  "12": "768x1536",
}

/**
 * 视频生成尺寸映射
 * 基于用户选择的比例，返回对应的标准尺寸 (宽 x 高)
 */
export const VIDEO_DIMENSION_MAP: Record<string, { width: number; height: number }> = {
  // 1:1 正方形
  "11": { width: 1080, height: 1080 },

  // 9:16 竖屏 (抖音/快手/小红书竖屏)
  "916": { width: 1080, height: 1920 },

  // 16:9 横屏 (B站/油管/电影/机器屏)
  "169": { width: 1920, height: 1080 },

  // 4:3 标准 (日常照片、作品展示)
  "43": { width: 1440, height: 1080 },

  // 3:4 竖版 (小红书、图文配图)
  "34": { width: 1080, height: 1440 },
}

/**
 * 根据比例 ID 和比例数值计算实际尺寸
 * @param ratioId - 比例 ID (如 "11", "916", "169")
 * @param ratioW - 比例宽度 (如 16)
 * @param ratioH - 比例高度 (如 9)
 * @returns 格式化的尺寸字符串或 { width, height } 对象
 */

/**
 * 转换图片生成的尺寸
 * @param ratioId - 比例 ID
 * @returns 图片尺寸字符串，如 "1024x1024"
 */
export function getImageDimension(ratioId: string): string {
  return IMAGE_DIMENSION_MAP[ratioId] || "1024x1024"
}

/**
 * 转换视频生成的尺寸
 * @param ratioId - 比例 ID
 * @returns 视频尺寸对象 { width, height }
 */
export function getVideoDimensions(ratioId: string): { width: number; height: number } {
  return VIDEO_DIMENSION_MAP[ratioId] || { width: 1080, height: 1080 }
}

/**
 * 从尺寸字符串提取宽高
 * @param dimension - 尺寸字符串，如 "1024x1024"
 * @returns { width, height }
 */
export function parseDimension(dimension: string): { width: number; height: number } {
  const [w, h] = dimension.split("x").map(Number)
  return { width: w || 1024, height: h || 1024 }
}
