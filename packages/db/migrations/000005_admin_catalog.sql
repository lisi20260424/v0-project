CREATE TABLE IF NOT EXISTS admin_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_type TEXT NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'per_use',
  cost_per_use INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_models_public ON admin_models(enabled, model_type, sort_order);

CREATE TABLE IF NOT EXISTS admin_prompts (
  id TEXT PRIMARY KEY,
  model_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_prompts_public ON admin_prompts(enabled, model_type, sort_order);

INSERT INTO admin_providers (id, name, display_name, description, config, enabled, sort_order)
VALUES
  ('provider_google', 'google', 'Google', 'Google AI models', '{"ui_by_type":{"video":{"display_name":"Veo Video","icon":"Video","accent":"from-emerald-500/30 to-teal-500/10","description":"Cinematic video generation.","cost":"30 points"}}}'::jsonb, true, 10),
  ('provider_openai', 'openai', 'OpenAI', 'OpenAI multimodal models', '{"ui_by_type":{"image":{"display_name":"GPT-Image","icon":"ImageIcon","accent":"from-violet-500/30 to-fuchsia-500/10","description":"Detailed image generation.","cost":"4 points"}}}'::jsonb, true, 20),
  ('provider_suno', 'suno', 'Suno', 'AI music models', '{"ui_by_type":{"music":{"display_name":"Suno Music","icon":"Music2","accent":"from-cyan-500/30 to-blue-500/10","description":"Full song generation.","cost":"8 points"}}}'::jsonb, true, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_models (id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order)
VALUES
  ('model_veo_video', 'Veo 3.1', 'google', 'video', 'per_use', 30, 'High-quality text-to-video and image-to-video generation.', '{"is_default_display":true,"ratios":["16:9","9:16","1:1"],"durations":["5","10"],"max_count":2,"supports_image_to_video":true,"image_capability":"start_end_frames","multi_image_max":5,"supports_negative_prompt":false}'::jsonb, true, 10),
  ('model_gpt_image', 'GPT-Image', 'openai', 'image', 'per_use', 4, 'General purpose image generation.', '{"is_default_display":true,"ratios":["1:1","9:16","16:9","3:4","4:3"],"qualities":["standard","hd"],"max_count":4,"supports_negative_prompt":true,"supports_reference_image":false}'::jsonb, true, 20),
  ('model_suno_music', 'Suno V5', 'suno', 'music', 'per_use', 8, 'Text-to-song generation with optional lyrics.', '{"is_default_display":true,"genres":["Pop","Electronic","Rock","Folk","Hip Hop"],"moods":["Happy","Epic","Calm","Sad"],"vocals":["female","male","duet","instrumental"],"tracks_per_generation":2}'::jsonb, true, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_prompts (id, model_type, title, content, category, enabled, sort_order)
VALUES
  ('prompt_video_1', 'video', 'City night', 'A cinematic night street scene with neon lights and slow camera movement.', 'demo', true, 10),
  ('prompt_image_1', 'image', 'Product photo', 'A premium product photo on a marble table with soft studio lighting.', 'demo', true, 10),
  ('prompt_music_1', 'music', 'Summer city', 'An upbeat electronic pop track for a summer city vlog.', 'demo', true, 10)
ON CONFLICT (id) DO NOTHING;
