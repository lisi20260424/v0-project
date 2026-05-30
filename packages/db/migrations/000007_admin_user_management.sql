ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vip_tier ON user_profiles(vip_tier);

INSERT INTO user_profiles (user_id, display_name, points)
SELECT u.id, split_part(u.email, '@', 1), 800
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
