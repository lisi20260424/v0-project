CREATE TABLE IF NOT EXISTS subscription_orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_kind TEXT NOT NULL CHECK (plan_kind IN ('membership', 'points')),
  plan_code TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT '',
  original_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_points BIGINT NOT NULL DEFAULT 0,
  vip_tier TEXT,
  vip_starts_at TIMESTAMPTZ,
  vip_expires_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  provider_sn TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_user_created
  ON subscription_orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'consumption', 'refund')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  points BIGINT NOT NULL DEFAULT 0,
  points_balance_after BIGINT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  related_order_id TEXT,
  related_task_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_records_user_created
  ON billing_records(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_point_ledger (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  points BIGINT NOT NULL CHECK (points >= 0),
  balance_after BIGINT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  related_order_id TEXT,
  related_task_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_point_ledger_user_created
  ON user_point_ledger(user_id, created_at DESC);
