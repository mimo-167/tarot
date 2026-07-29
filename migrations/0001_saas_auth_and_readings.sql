PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  locale TEXT NOT NULL DEFAULT 'zh-CN' CHECK (locale IN ('zh-CN', 'en')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_status ON users(status, created_at DESC);

CREATE TABLE login_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  code_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX idx_login_codes_email_created
  ON login_codes(email, created_at DESC);
CREATE INDEX idx_login_codes_expiry ON login_codes(expires_at);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE ai_previews (
  id TEXT PRIMARY KEY,
  guest_token_hash TEXT NOT NULL,
  user_id TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  full_reading TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  unlocked_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_previews_guest ON ai_previews(guest_token_hash, created_at DESC);
CREATE INDEX idx_ai_previews_user ON ai_previews(user_id, created_at DESC);
CREATE INDEX idx_ai_previews_expiry ON ai_previews(expires_at);

CREATE TABLE readings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  question TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  timeframe TEXT NOT NULL DEFAULT '',
  spread_id TEXT NOT NULL,
  spread_name TEXT NOT NULL,
  spread_description TEXT NOT NULL DEFAULT '',
  positions_json TEXT NOT NULL,
  options_json TEXT,
  cards_json TEXT NOT NULL,
  ai_reading TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_readings_user_created ON readings(user_id, created_at DESC);
CREATE INDEX idx_readings_spread_created ON readings(spread_id, created_at DESC);
CREATE INDEX idx_readings_created ON readings(created_at DESC);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_user_id, created_at DESC);
