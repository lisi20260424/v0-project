-- ============================================================================
-- 测试数据 SQL - 补充额外测试供应商与模型
-- ============================================================================

-- ============================================================================
-- 1. 清空现有测试数据（可选，注意保留已配置的生产数据）
-- ============================================================================

-- DELETE FROM admin_models WHERE provider IN ('anthropic', 'mistral', 'meta', 'stability');
-- DELETE FROM admin_providers WHERE name IN ('anthropic', 'mistral', 'meta', 'stability');


-- ============================================================================
-- 2. 插入额外供应商
-- ============================================================================

INSERT INTO admin_providers (
  id, name, display_name, description, config, enabled, sort_order, created_at, updated_at
) VALUES
  -- Anthropic - 文本生成
  (
    'f1234567-1234-1234-1234-123456789abc',
    'anthropic',
    'Anthropic',
    'Claude 系列大模型提供商，擅长长文本理解与推理',
    jsonb_build_object(
      'ui_by_type', jsonb_build_object(
        'video', jsonb_build_object(
          'display_name', 'Claude 视频分析',
          'icon', 'MessageSquare',
          'accent', 'from-purple-500/30 to-pink-500/10',
          'tag', 'Pro',
          'href', '/claude/video',
          'cost', '0.003',
          'description', '智能视频内容分析与生成'
        )
      )
    ),
    true,
    10,
    now(),
    now()
  ),
  
  -- Mistral AI - 文本生成
  (
    'f2345678-2345-2345-2345-234567890abc',
    'mistral',
    'Mistral AI',
    '开源高效大模型专家，性能卓越成本低廉',
    jsonb_build_object(
      'ui_by_type', jsonb_build_object(
        'image', jsonb_build_object(
          'display_name', 'Mistral 图像',
          'icon', 'ImageIcon',
          'accent', 'from-orange-500/30 to-red-500/10',
          'tag', '快速',
          'href', '/mistral/image',
          'cost', '0.001',
          'description', '轻量级高效图像处理'
        )
      )
    ),
    true,
    11,
    now(),
    now()
  ),
  
  -- Meta - 开源模型
  (
    'f3456789-3456-3456-3456-345678901abc',
    'meta',
    'Meta',
    'Llama 开源模型系列，社区应用广泛',
    jsonb_build_object(
      'ui_by_type', jsonb_build_object(
        'audio', jsonb_build_object(
          'display_name', 'Llama 音乐',
          'icon', 'Music2',
          'accent', 'from-blue-500/30 to-cyan-500/10',
          'tag', '开源',
          'href', '/llama/music',
          'cost', '0.0005',
          'description', '开源音乐生成与处理'
        )
      )
    ),
    true,
    12,
    now(),
    now()
  ),
  
  -- Stability AI - 图像生成
  (
    'f4567890-4567-4567-4567-456789012abc',
    'stability',
    'Stability AI',
    'Stable Diffusion 系列模型，图像生成领导者',
    jsonb_build_object(
      'ui_by_type', jsonb_build_object(
        'image', jsonb_build_object(
          'display_name', 'Stable Diffusion XL',
          'icon', 'Wand2',
          'accent', 'from-green-500/30 to-emerald-500/10',
          'tag', '3.0',
          'href', '/stable/image',
          'cost', '0.0015',
          'description', '专业级图像生成与编辑'
        )
      )
    ),
    true,
    13,
    now(),
    now()
  )
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 3. 插入对应供应商的模型
-- ============================================================================

INSERT INTO admin_models (
  id, name, provider, model_type, description, cost_per_use, 
  billing_type, config, enabled, sort_order, created_at, updated_at
) VALUES
  -- Anthropic Claude 模型
  (
    'a1111111-1111-1111-1111-111111111111',
    'Claude 3.5 Sonnet',
    'anthropic',
    'video',
    'Claude 3.5 系列最新版本，支持视频内容理解与分析',
    3,
    'per_api_call',
    jsonb_build_object('is_default_display', true),
    true,
    1,
    now(),
    now()
  ),
  (
    'a1111112-1111-1111-1111-111111111111',
    'Claude 3 Opus',
    'anthropic',
    'video',
    '高性能版本，推理能力强',
    4,
    'per_api_call',
    jsonb_build_object('is_default_display', false),
    true,
    2,
    now(),
    now()
  ),
  
  -- Mistral 模型
  (
    'm2222222-2222-2222-2222-222222222222',
    'Mistral Large',
    'mistral',
    'image',
    'Mistral 旗舰模型，高效推理',
    1,
    'per_api_call',
    jsonb_build_object('is_default_display', true),
    true,
    1,
    now(),
    now()
  ),
  (
    'm2222223-2222-2222-2222-222222222222',
    'Mistral 7B',
    'mistral',
    'image',
    '轻量级模型，快速推理',
    0.5,
    'per_api_call',
    jsonb_build_object('is_default_display', false),
    true,
    2,
    now(),
    now()
  ),
  
  -- Meta Llama 模型
  (
    'l3333333-3333-3333-3333-333333333333',
    'Llama 3.1 70B',
    'meta',
    'audio',
    'Llama 3.1 系列大模型，开源社区首选',
    0.5,
    'per_api_call',
    jsonb_build_object('is_default_display', true),
    true,
    1,
    now(),
    now()
  ),
  (
    'l3333334-3333-3333-3333-333333333333',
    'Llama 3 8B',
    'meta',
    'audio',
    '轻量级高效版本',
    0.2,
    'per_api_call',
    jsonb_build_object('is_default_display', false),
    true,
    2,
    now(),
    now()
  ),
  
  -- Stability AI 模型
  (
    's4444444-4444-4444-4444-444444444444',
    'Stable Diffusion 3.0',
    'stability',
    'image',
    '最新版本，生成质量提升 40%',
    1.5,
    'per_api_call',
    jsonb_build_object('is_default_display', true),
    true,
    1,
    now(),
    now()
  ),
  (
    's4444445-4444-4444-4444-444444444444',
    'Stable Diffusion XL',
    'stability',
    'image',
    '上一代旗舰，稳定可靠',
    1.0,
    'per_api_call',
    jsonb_build_object('is_default_display', false),
    true,
    2,
    now(),
    now()
  )
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 4. 插入测试提示词
-- ============================================================================

INSERT INTO admin_prompts (
  id, title, content, category, model_type, enabled, sort_order, created_at, updated_at
) VALUES
  -- 视频生成提示词
  (
    'p1111111-1111-1111-1111-111111111111',
    '科技风格视频',
    '生成一段展示最新科技产品的宣传视频，采用极简主义设计风格，配以现代感十足的音乐背景，突出产品的创新特性。视频应该包含产品360度展示、使用场景演示以及用户反馈。',
    'product_showcase',
    'video',
    true,
    1,
    now(),
    now()
  ),
  (
    'p1111112-1111-1111-1111-111111111111',
    '旅游风景视频',
    '创建一段美景旅游宣传视频，展示目的地的自然风光、文化特色和人文景观。采用电影级别的拍摄手法，包含航拍镜头、特写镜头和全景景观。配上舒缓的背景音乐和优美的字幕。',
    'travel',
    'video',
    true,
    2,
    now(),
    now()
  ),
  
  -- 图像生成提示词
  (
    'p2222222-2222-2222-2222-222222222222',
    '概念艺术设计',
    '设计一个未来主义的城市场景，采用赛博朋克风格。包含悬浮的建筑、霓虹灯、飞行车辆、以及复杂的技术元素。画面应该充满细节，体现高科技与艺术的完美结合。',
    'concept_art',
    'image',
    true,
    1,
    now(),
    now()
  ),
  (
    'p2222223-2222-2222-2222-222222222222',
    '产品渲染图',
    '生成一张高端产品渲染图，展示一个未来科技产品。采用工业设计风格，背景为简洁的工作室环境，光线专业打磨，材质精细逼真，具有高端电子产品的质感。',
    'product_render',
    'image',
    true,
    2,
    now(),
    now()
  ),
  
  -- 音乐生成提示词
  (
    'p3333333-3333-3333-3333-333333333333',
    '企业品牌背景音乐',
    '创作一首适合企业宣传的背景音乐。节奏明快，充满能量感，体现专业与创新。乐器组合：钢琴、弦乐、现代电子乐元素。时长2分钟左右。',
    'corporate',
    'audio',
    true,
    1,
    now(),
    now()
  ),
  (
    'p3333334-3333-3333-3333-333333333333',
    '放松冥想音乐',
    '创作一首舒缓的冥想背景音乐。节奏缓慢，音调温和，采用自然音响与民族乐器。帮助听者放松身心，适合瑜伽课程或冥想练习。时长10分钟。',
    'wellness',
    'audio',
    true,
    2,
    now(),
    now()
  )
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 5. 验证数据
-- ============================================================================

-- 查看插入的供应商数量
SELECT COUNT(*) as provider_count FROM admin_providers;

-- 查看插入的模型数量
SELECT COUNT(*) as model_count FROM admin_models;

-- 查看每个供应商的模型数
SELECT provider, model_type, COUNT(*) as model_count 
FROM admin_models 
GROUP BY provider, model_type 
ORDER BY provider, model_type;

-- 查看默认展示的模型
SELECT provider, model_type, name 
FROM admin_models 
WHERE config->>'is_default_display' = 'true' 
ORDER BY provider, model_type;
