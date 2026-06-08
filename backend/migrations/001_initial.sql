CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  last_seen_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  room_code TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  host_player_id TEXT NOT NULL,
  state JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  result_recorded_at BIGINT
);

CREATE TABLE IF NOT EXISTS game_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  won BOOLEAN NOT NULL,
  winner_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  net_worth INTEGER NOT NULL,
  cash INTEGER NOT NULL,
  passive_income INTEGER NOT NULL,
  project_income INTEGER NOT NULL,
  project_assets INTEGER NOT NULL,
  reputation INTEGER NOT NULL,
  finished_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_user_id_finished_at ON game_history(user_id, finished_at DESC);
