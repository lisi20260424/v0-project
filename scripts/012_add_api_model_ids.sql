-- 更新现有模型配置，添加 API 调用需要的模型标识
-- 这个脚本为每个模型的 config 中添加 api_model_id 字段

-- 视频模型
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gpt-4o-video"')
WHERE name = 'Veo 视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"sora-video"')
WHERE name = 'Sora 视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"kling-video"')
WHERE name = '可灵视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"grok-video"')
WHERE name = 'Grok 视频' AND model_type = 'video';

-- 图像模型
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"dall-e-3"')
WHERE name = 'GPT-Image' AND model_type = 'image';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gemini-2-flash-image"')
WHERE name = 'Nano Banana' AND model_type = 'image';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"flux-pro"')
WHERE name = 'Flux 图像' AND model_type = 'image';

-- 音乐模型
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"suno-v5"')
WHERE name = 'Suno 音乐' AND model_type = 'music';
