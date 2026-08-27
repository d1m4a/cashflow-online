-- Snapshot of the schema produced by backend/migrations/*.sql.
-- Regenerate this file whenever a migration is added; it is documentation,
-- not the source of truth. The migrations are.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password JSONB NOT NULL,
  email_verified_at BIGINT,
  password_changed_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  last_seen_at BIGINT NOT NULL,
  expires_at BIGINT,
  revoked_at BIGINT
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  token_digest TEXT NOT NULL UNIQUE,
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  room_code TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  host_player_id TEXT NOT NULL,
  state JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  result_recorded_at BIGINT,
  archived_at BIGINT
);

CREATE TABLE IF NOT EXISTS game_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  won BOOLEAN NOT NULL,
  winner_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  profession_id TEXT,
  profession TEXT,
  finish_reason TEXT NOT NULL DEFAULT 'unknown',
  victory_mode TEXT NOT NULL DEFAULT 'classic',
  game_length TEXT NOT NULL DEFAULT 'open',
  turn_count INTEGER NOT NULL DEFAULT 0,
  round INTEGER NOT NULL DEFAULT 1,
  player_count INTEGER NOT NULL DEFAULT 1,
  net_worth INTEGER NOT NULL,
  cash INTEGER NOT NULL,
  passive_income INTEGER NOT NULL,
  project_income INTEGER NOT NULL,
  project_assets INTEGER NOT NULL,
  bankruptcy_count INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER NOT NULL DEFAULT 1,
  capital_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  reputation INTEGER NOT NULL,
  finished_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_revoked ON sessions(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_digest ON auth_tokens(token_digest);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_kind ON auth_tokens(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(archived_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_user_id_finished_at ON game_history(user_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_user_profession ON game_history(user_id, profession_id);
CREATE INDEX IF NOT EXISTS idx_game_history_user_won ON game_history(user_id, won);
