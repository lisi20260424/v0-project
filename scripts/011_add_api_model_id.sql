-- 更新 admin_models 配置，为每个模型添加 api_model_id 字段
-- api_model_id 用于调用 New API 网关时传递给 model 参数

-- 视频模型：更新 config 添加 api_model_id
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gpt-4-vision"'::jsonb)
WHERE name = 'Veo 视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gpt-4-vision"'::jsonb)
WHERE name = 'Sora 视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gpt-4-vision"'::jsonb)
WHERE name = '可灵视频' AND model_type = 'video';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"gpt-4-vision"'::jsonb)
WHERE name = 'Grok 视频' AND model_type = 'video';

-- 图像模型：更新 config 添加 api_model_id
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"dall-e-3"'::jsonb)
WHERE name = 'GPT-Image' AND model_type = 'image';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"dall-e-3"'::jsonb)
WHERE name = 'Nano Banana' AND model_type = 'image';

UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"dall-e-3"'::jsonb)
WHERE name = 'Flux 图像' AND model_type = 'image';

-- 音乐模型：更新 config 添加 api_model_id
UPDATE admin_models
SET config = jsonb_set(config, '{api_model_id}', '"suno-v3"'::jsonb)
WHERE name = 'Suno 音乐' AND model_type = 'music';
