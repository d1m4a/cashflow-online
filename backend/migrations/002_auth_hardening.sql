ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at BIGINT,
  ADD COLUMN IF NOT EXISTS password_changed_at BIGINT;

UPDATE users
SET password_changed_at = COALESCE(password_changed_at, updated_at)
WHERE password_changed_at IS NULL;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS expires_at BIGINT,
  ADD COLUMN IF NOT EXISTS revoked_at BIGINT;

UPDATE sessions
SET expires_at = COALESCE(expires_at, created_at + 2592000000)
WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  token_digest TEXT NOT NULL UNIQUE,
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_digest ON auth_tokens(token_digest);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_kind ON auth_tokens(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_revoked ON sessions(user_id, revoked_at);
