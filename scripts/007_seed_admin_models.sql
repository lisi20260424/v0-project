-- 将首页 / Header 中的 8 款 AI 工具 mock 数据导入数据库
-- 包含 admin_providers（供应商）和 admin_models（模型，UI 展示配置存入 config 字段）
-- 重复执行安全：使用 ON CONFLICT 与 NOT EXISTS 避免重复

-- ===== 1. 供应商 =====
INSERT INTO admin_providers (name, display_name, description, enabled, sort_order)
VALUES
  ('google',          'Google',             '谷歌出品的多模态模型供应商，包含 Veo 视频与 Nano Banana 图像。', true, 10),
  ('openai',          'OpenAI',             'OpenAI 提供的 Sora 视频与 GPT-Image 图像模型。',                 true, 20),
  ('kuaishou',        'Kuaishou',           '快手可灵团队自研的视频生成模型。',                              true, 30),
  ('xai',             'xAI',                'xAI（Grok）的视频生成能力。',                                   true, 40),
  ('black-forest',    'Black Forest Labs',  'Flux 系列开源图像模型作者。',                                   true, 50),
  ('suno',            'Suno',               '专注 AI 音乐生成的厂商，最新版本 V5。',                          true, 60)
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    sort_order = EXCLUDED.sort_order;

-- ===== 2. 模型（带 UI 展示配置）=====
-- 注意：admin_models.id 是 uuid，所以这里用 (model_type, name) 作为去重键

-- 视频生成
INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Veo 视频', 'Google Veo 3.1', 'video', 'per_use', 30,
  '文生视频、图生视频，支持 4K 超清与电影级镜头语言。',
  true, 10,
  jsonb_build_object(
    'ui_icon',   'Video',
    'ui_tag',    '4K',
    'ui_accent', 'from-emerald-500/30 to-teal-500/10',
    'ui_href',   '/veo'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'video' AND name = 'Veo 视频');

INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Sora 视频', 'OpenAI Sora 2', 'video', 'per_use', 25,
  '高度真实的世界模拟器，支持 10s / 15s 时长，物理一致性强。',
  true, 20,
  jsonb_build_object(
    'ui_icon',   'Film',
    'ui_tag',    'Pro',
    'ui_accent', 'from-sky-500/30 to-indigo-500/10',
    'ui_href',   '/sora'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'video' AND name = 'Sora 视频');

INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  '可灵视频', 'Kuaishou Kling 2.0', 'video', 'per_use', 20,
  '中国团队自研，中文指令理解精准，人物动作自然流畅。',
  true, 30,
  jsonb_build_object(
    'ui_icon',   'Sparkles',
    'ui_tag',    'HOT',
    'ui_accent', 'from-amber-500/30 to-orange-500/10',
    'ui_href',   '/kling'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'video' AND name = '可灵视频');

INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Grok 视频', 'xAI Grok Video', 'video', 'per_use', 15,
  '单图快速驱动成片，视频尺寸自动跟随参考图，轻量创意首选。',
  true, 40,
  jsonb_build_object(
    'ui_icon',   'Play',
    'ui_tag',    '新',
    'ui_accent', 'from-zinc-500/30 to-slate-500/10',
    'ui_href',   '/grok'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'video' AND name = 'Grok 视频');

-- 图像生成
INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'GPT-Image', 'OpenAI GPT-Image 2', 'image', 'per_use', 4,
  '全新一代多模态图像生成，细节丰富，支持精准文字渲染。',
  true, 10,
  jsonb_build_object(
    'ui_icon',   'ImageIcon',
    'ui_tag',    '新上线',
    'ui_accent', 'from-violet-500/30 to-fuchsia-500/10',
    'ui_href',   '/image'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'image' AND name = 'GPT-Image');

INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Nano Banana', 'Google Nano Banana', 'image', 'per_use', 5,
  '交互式图像编辑，支持多图融合、局部重绘、风格迁移。',
  true, 20,
  jsonb_build_object(
    'ui_icon',   'Banana',
    'ui_accent', 'from-yellow-500/30 to-amber-500/10',
    'ui_href',   '/image?model=nano-banana'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'image' AND name = 'Nano Banana');

INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Flux 图像', 'Black Forest Labs Flux', 'image', 'per_use', 3,
  '开源顶级图像模型，摄影级真实质感，艺术创作首选。',
  true, 30,
  jsonb_build_object(
    'ui_icon',   'Wand2',
    'ui_accent', 'from-rose-500/30 to-pink-500/10',
    'ui_href',   '/image?model=flux'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'image' AND name = 'Flux 图像');

-- 音乐生成
INSERT INTO admin_models (name, provider, model_type, billing_type, cost_per_use, description, enabled, sort_order, config)
SELECT
  'Suno 音乐', 'Suno V5', 'music', 'per_use', 8,
  '输入歌词或描述，生成完整的人声 + 伴奏的高质量歌曲。',
  true, 10,
  jsonb_build_object(
    'ui_icon',   'Music2',
    'ui_tag',    'V5',
    'ui_accent', 'from-cyan-500/30 to-blue-500/10',
    'ui_href',   '/suno'
  )
WHERE NOT EXISTS (SELECT 1 FROM admin_models WHERE model_type = 'music' AND name = 'Suno 音乐');
