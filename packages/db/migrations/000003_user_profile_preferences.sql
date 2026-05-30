ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_video_model TEXT NOT NULL DEFAULT 'model_veo_video',
  default_image_model TEXT NOT NULL DEFAULT 'model_gpt_image',
  default_ratio TEXT NOT NULL DEFAULT '16:9',
  language TEXT NOT NULL DEFAULT 'zh-CN',
  theme TEXT NOT NULL DEFAULT 'light',
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_sms BOOLEAN NOT NULL DEFAULT false,
  notify_inbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO user_preferences (user_id)
SELECT u.id
FROM users u
LEFT JOIN user_preferences p ON p.user_id = u.id
WHERE p.user_id IS NULL;
