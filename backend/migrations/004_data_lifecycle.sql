-- Room lifecycle: archived_at lived only inside the JSONB state, so every
-- "is this room still active" question meant parsing every row.
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS archived_at BIGINT;

UPDATE rooms
SET archived_at = NULLIF((state ->> 'archivedAt'), '')::BIGINT
WHERE archived_at IS NULL
  AND state ->> 'archivedAt' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(archived_at, updated_at DESC);

-- Expiry sweeps had no supporting index: sessions and auth_tokens only ever grew.
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
