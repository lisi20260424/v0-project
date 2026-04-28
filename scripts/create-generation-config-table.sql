-- 创建生成配置表（如果不存在）
CREATE TABLE IF NOT EXISTS admin_generation_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  music_timeout INT DEFAULT 600,      -- 秒，默认10分钟
  image_timeout INT DEFAULT 300,      -- 秒，默认5分钟
  video_timeout INT DEFAULT 1800,     -- 秒，默认30分钟
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- 插入初始值（如果表为空）
INSERT INTO admin_generation_config (id, music_timeout, image_timeout, video_timeout)
VALUES (1, 600, 300, 1800)
ON CONFLICT (id) DO NOTHING;
