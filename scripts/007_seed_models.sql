-- 插入供应商数据
INSERT INTO public.admin_providers (id, name, display_name, enabled, sort_order, config, description, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'openai', 'OpenAI', true, 1, '{"ui_by_type":{"video":{"display_name":"Sora 视频","icon":"Film","cost":"Pro","description":"OpenAI's advanced video generation model"},"image":{"display_name":"GPT-Image","icon":"ImageIcon","cost":"标准","description":"高质量图像生成"}}}', 'OpenAI 官方 API', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'google', 'Google', true, 2, '{"ui_by_type":{"video":{"display_name":"Veo 视频","icon":"Film","cost":"4K","description":"Google Veo - Advanced video generation"},"image":{"display_name":"Nano Banana","icon":"ImageIcon","cost":"标准","description":"Google image generation"}}}', 'Google Gemini 和 VideoPoet', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'suno', 'Suno', true, 3, '{"ui_by_type":{"music":{"display_name":"Suno 音乐","icon":"Music","cost":"标准","description":"AI 音乐生成"}}}', 'Suno v5 音乐生成 API', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'stability', 'Stability AI', true, 4, '{"ui_by_type":{"image":{"display_name":"Flux 图像","icon":"ImageIcon","cost":"标准","description":"Flux - High quality image generation"},"video":{"display_name":"可灵视频","icon":"Film","cost":"HOT","description":"Kuaishou Kling video generation"}}}', 'Stability AI 和 Kuaishou', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'xai', 'xAI', true, 5, '{"ui_by_type":{"video":{"display_name":"Grok 视频","icon":"Film","cost":"新","description":"xAI Grok video generation"}}}', 'xAI Grok 视频生成', now(), now())
ON CONFLICT DO NOTHING;

-- 插入视频模型
INSERT INTO public.admin_models (id, name, provider, model_type, enabled, description, cost_per_use, sort_order, config, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001'::uuid, 'Sora 2', 'openai', 'video', true, 'OpenAI 最新视频生成模型，支持 4K 分辨率和高级控制', 25, 1, '{"is_default_display":true,"capabilities":{"max_duration":60,"ratios":["16:9","9:16","1:1"],"supports_image_to_video":true}}', now(), now()),
  ('650e8400-e29b-41d4-a716-446655440002'::uuid, 'Veo 3.1', 'google', 'video', true, 'Google 高质量视频生成，支持 4K 和复杂场景', 30, 1, '{"is_default_display":true,"capabilities":{"max_duration":60,"ratios":["16:9","9:16","1:1"],"supports_image_to_video":true}}', now(), now()),
  ('650e8400-e29b-41d4-a716-446655440003'::uuid, 'Kling 2.0', 'stability', 'video', true, '可灵视频生成，支持高分辨率输出', 20, 2, '{"capabilities":{"max_duration":60,"ratios":["16:9","9:16"],"supports_image_to_video":true}}', now(), now()),
  ('650e8400-e29b-41d4-a716-446655440004'::uuid, 'Grok Video', 'xai', 'video', true, 'xAI Grok 视频生成功能', 15, 3, '{"capabilities":{"max_duration":60,"ratios":["16:9"]}}', now(), now())
ON CONFLICT DO NOTHING;

-- 插入图像模型
INSERT INTO public.admin_models (id, name, provider, model_type, enabled, description, cost_per_use, sort_order, config, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440005'::uuid, 'DALL-E 3', 'openai', 'image', true, 'OpenAI 高质量图像生成', 15, 1, '{"is_default_display":true,"capabilities":{"ratios":["1:1","16:9","9:16"]}}', now(), now()),
  ('650e8400-e29b-41d4-a716-446655440006'::uuid, 'Nano Banana', 'google', 'image', true, 'Google 图像生成模型', 12, 2, '{"capabilities":{"ratios":["1:1","16:9","9:16"]}}', now(), now()),
  ('650e8400-e29b-41d4-a716-446655440007'::uuid, 'Flux Pro', 'stability', 'image', true, 'Stability AI Flux 图像生成', 18, 3, '{"capabilities":{"ratios":["1:1","16:9","9:16"]}}', now(), now())
ON CONFLICT DO NOTHING;

-- 插入音乐模型
INSERT INTO public.admin_models (id, name, provider, model_type, enabled, description, cost_per_use, sort_order, config, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440008'::uuid, 'Suno v5', 'suno', 'music', true, 'Suno 最新音乐生成模型，支持歌词自定义', 10, 1, '{"is_default_display":true,"capabilities":{"supports_custom_lyrics":true,"max_duration":480}}', now(), now())
ON CONFLICT DO NOTHING;
