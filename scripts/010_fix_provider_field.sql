-- 修正 admin_models 中的 provider 字段值
-- 本脚本将模型的 provider 字段从完整模型描述改为供应商名称

UPDATE admin_models SET provider = 'google' WHERE name = 'Veo 视频';
UPDATE admin_models SET provider = 'openai' WHERE name = 'Sora 视频';
UPDATE admin_models SET provider = 'kuaishou' WHERE name = '可灵视频';
UPDATE admin_models SET provider = 'xai' WHERE name = 'Grok 视频';
UPDATE admin_models SET provider = 'openai' WHERE name = 'GPT-Image';
UPDATE admin_models SET provider = 'google' WHERE name = 'Nano Banana';
UPDATE admin_models SET provider = 'black-forest' WHERE name = 'Flux 图像';
UPDATE admin_models SET provider = 'suno' WHERE name = 'Suno 音乐';

-- 更新模型的 config 字段，添加实际的 AI SDK 模型 ID
UPDATE admin_models SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{model_id}',
  '"gpt-4-vision"'::jsonb
) WHERE name = 'GPT-Image';

UPDATE admin_models SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{model_id}',
  '"gpt-4-vision"'::jsonb
) WHERE name = 'Sora 视频';

UPDATE admin_models SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{model_id}',
  '"claude-3-opus-20240229"'::jsonb
) WHERE name IN ('Veo 视频', 'Nano Banana');

UPDATE admin_models SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{model_id}',
  '"claude-3-opus-20240229"'::jsonb
) WHERE name IN ('可灵视频', 'Grok 视频', 'Flux 图像', 'Suno 音乐');
