CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admin_settings (key, value)
VALUES
  ('gateway', '{"apiKey":"","gatewayUrl":""}'::jsonb),
  ('generation_config', '{"musicTimeout":600,"imageTimeout":300,"videoTimeout":1800}'::jsonb),
  ('payment', '{"enabled":false,"vendor_sn":"","vendor_key":"","app_id":"","terminal_sn":"","terminal_key":"","device_id":"","operator":"","notify_url":"","return_url":"","gateway_url":"","callback_public_key":"","test_mode":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
