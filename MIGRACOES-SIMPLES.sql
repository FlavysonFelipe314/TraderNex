ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS myfxbook_integration_login VARCHAR(100);
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE mt4_accounts ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(20) DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'agressivo'));
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tradernex.com';
