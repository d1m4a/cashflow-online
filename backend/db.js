const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://cashflow:cashflow@localhost:15432/cashflow_online";
const pool = new Pool({
  connectionString: DATABASE_URL
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    )
  `);
  await runMigrations();
}

async function closeDb() {
  await pool.end();
}

async function findUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rowToUser(result.rows[0]);
}

async function findUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rowToUser(result.rows[0]);
}

async function insertUser(user) {
  await pool.query(
    `INSERT INTO users (id, name, email, password, email_verified_at, password_changed_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      user.id,
      user.name,
      user.email,
      user.password,
      user.emailVerifiedAt || null,
      user.passwordChangedAt,
      user.createdAt,
      user.updatedAt
    ]
  );
}

async function updateUserName(id, name, updatedAt) {
  await pool.query(
    "UPDATE users SET name = $2, updated_at = $3 WHERE id = $1",
    [id, name, updatedAt]
  );
}

async function updateUserPassword(id, password, updatedAt) {
  await pool.query(
    `UPDATE users
     SET password = $2,
         password_changed_at = $3,
         updated_at = $3
     WHERE id = $1`,
    [id, password, updatedAt]
  );
}

async function verifyUserEmail(id, verifiedAt) {
  await pool.query(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, $2),
         updated_at = $2
     WHERE id = $1`,
    [id, verifiedAt]
  );
}

async function insertSession(session) {
  await pool.query(
    `INSERT INTO sessions (token, user_id, created_at, last_seen_at, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [session.token, session.userId, session.createdAt, session.lastSeenAt, session.expiresAt]
  );
}

async function findSession(token) {
  const result = await pool.query("SELECT * FROM sessions WHERE token = $1", [token]);
  return rowToSession(result.rows[0]);
}

async function touchSession(token, lastSeenAt) {
  await pool.query("UPDATE sessions SET last_seen_at = $2 WHERE token = $1", [token, lastSeenAt]);
}

async function deleteSession(token) {
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}

async function revokeSession(token, revokedAt) {
  await pool.query("UPDATE sessions SET revoked_at = $2 WHERE token = $1", [token, revokedAt]);
}

async function revokeUserSessions(userId, revokedAt, exceptToken = null) {
  const params = [userId, revokedAt];
  let exceptClause = "";
  if (exceptToken) {
    params.push(exceptToken);
    exceptClause = "AND token <> $3";
  }
  await pool.query(
    `UPDATE sessions
     SET revoked_at = $2
     WHERE user_id = $1
       AND revoked_at IS NULL
       ${exceptClause}`,
    params
  );
}

async function insertAuthToken(token) {
  await pool.query(
    `INSERT INTO auth_tokens (id, user_id, kind, token_digest, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [token.id, token.userId, token.kind, token.tokenDigest, token.expiresAt, token.createdAt]
  );
}

async function findAuthToken(kind, tokenDigest) {
  const result = await pool.query(
    `SELECT *
     FROM auth_tokens
     WHERE kind = $1 AND token_digest = $2`,
    [kind, tokenDigest]
  );
  return rowToAuthToken(result.rows[0]);
}

async function markAuthTokenUsed(id, usedAt) {
  await pool.query("UPDATE auth_tokens SET used_at = $2 WHERE id = $1", [id, usedAt]);
}

async function deleteUserAuthTokens(userId, kind) {
  await pool.query("DELETE FROM auth_tokens WHERE user_id = $1 AND kind = $2", [userId, kind]);
}

async function loadRooms() {
  const result = await pool.query("SELECT state FROM rooms ORDER BY updated_at DESC");
  return result.rows.map((row) => row.state);
}

async function saveRoom(game) {
  await pool.query(
    `INSERT INTO rooms (room_code, status, host_player_id, state, created_at, updated_at, result_recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (room_code) DO UPDATE SET
       status = EXCLUDED.status,
       host_player_id = EXCLUDED.host_player_id,
       state = EXCLUDED.state,
       updated_at = EXCLUDED.updated_at,
       result_recorded_at = EXCLUDED.result_recorded_at`,
    [
      game.roomCode,
      game.status,
      game.hostId,
      game,
      game.createdAt,
      game.updatedAt,
      game.resultRecordedAt || null
    ]
  );
}

async function saveRooms(games) {
  for (const game of games) {
    await saveRoom(game);
  }
}

async function addHistoryRecords(game, records) {
  if (records.length === 0) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const record of records) {
      await client.query(
        `INSERT INTO game_history
          (id, user_id, room_code, won, winner_name, player_name, profession_id, profession,
           finish_reason, victory_mode, game_length, turn_count, round, player_count,
           net_worth, cash, passive_income, project_income, project_assets,
           bankruptcy_count, final_rank, capital_timeline, reputation, finished_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                 $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
         ON CONFLICT (id) DO NOTHING`,
        [
          record.id,
          record.userId,
          record.roomCode,
          record.won,
          record.winnerName,
          record.playerName,
          record.professionId,
          record.profession,
          record.finishReason,
          record.victoryMode,
          record.gameLength,
          record.turnCount,
          record.round,
          record.playerCount,
          record.netWorth,
          record.cash,
          record.passiveIncome,
          record.projectIncome,
          record.projectAssets,
          record.bankruptcyCount,
          record.finalRank,
          JSON.stringify(record.capitalTimeline || []),
          record.reputation,
          record.finishedAt
        ]
      );
    }
    await client.query(
      `UPDATE rooms
       SET result_recorded_at = $2,
           state = $3,
           updated_at = $4
       WHERE room_code = $1`,
      [game.roomCode, game.resultRecordedAt, game, game.updatedAt]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserHistory(userId, limit = 20) {
  const result = await pool.query(
    `SELECT *
     FROM game_history
     WHERE user_id = $1
     ORDER BY finished_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map(rowToHistoryRecord);
}

async function getUserStats(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS games,
       COUNT(*) FILTER (WHERE won)::int AS wins,
       COALESCE(MAX(net_worth), 0)::int AS best_net_worth,
       COALESCE(MAX(passive_income), 0)::int AS best_passive_income,
       COALESCE(MAX(project_income), 0)::int AS best_project_income,
       COALESCE(ROUND(AVG(net_worth)), 0)::int AS average_net_worth,
       COALESCE(ROUND(AVG(passive_income)), 0)::int AS average_passive_income,
       COALESCE(ROUND(AVG(project_income)), 0)::int AS average_project_income,
       COALESCE(ROUND(AVG(turn_count)), 0)::int AS average_turns,
       COALESCE(SUM(bankruptcy_count), 0)::int AS bankruptcy_count
     FROM game_history
     WHERE user_id = $1`,
    [userId]
  );
  const professionResult = await pool.query(
    `SELECT
       profession_id,
       COALESCE(profession, profession_id, 'Профессия') AS profession,
       COUNT(*)::int AS games,
       COUNT(*) FILTER (WHERE won)::int AS wins,
       COALESCE(ROUND(AVG(net_worth)), 0)::int AS average_net_worth,
       COALESCE(MAX(net_worth), 0)::int AS best_net_worth,
       COALESCE(ROUND(AVG(final_rank)), 0)::int AS average_rank
     FROM game_history
     WHERE user_id = $1
     GROUP BY profession_id, profession
     ORDER BY games DESC, wins DESC, best_net_worth DESC`,
    [userId]
  );
  const row = result.rows[0] || {};
  const games = row.games || 0;
  const wins = row.wins || 0;
  return {
    games,
    wins,
    winRate: games ? wins / games : 0,
    bestNetWorth: row.best_net_worth || 0,
    bestPassiveIncome: row.best_passive_income || 0,
    bestProjectIncome: row.best_project_income || 0,
    averageNetWorth: row.average_net_worth || 0,
    averagePassiveIncome: row.average_passive_income || 0,
    averageProjectIncome: row.average_project_income || 0,
    averageTurns: row.average_turns || 0,
    bankruptcyCount: row.bankruptcy_count || 0,
    professionStats: professionResult.rows.map((item) => ({
      professionId: item.profession_id,
      profession: item.profession,
      games: item.games || 0,
      wins: item.wins || 0,
      winRate: item.games ? item.wins / item.games : 0,
      averageNetWorth: item.average_net_worth || 0,
      bestNetWorth: item.best_net_worth || 0,
      averageRank: item.average_rank || 0
    }))
  };
}

async function healthCheck() {
  await pool.query("SELECT 1");
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const migration = path.basename(file, ".sql");
    const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", [migration]);
    if (applied.rowCount > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (id, applied_at) VALUES ($1, $2)",
        [migration, Date.now()]
      );
      await client.query("COMMIT");
      console.log(`Applied migration ${migration}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    emailVerifiedAt: row.email_verified_at ? Number(row.email_verified_at) : null,
    passwordChangedAt: row.password_changed_at ? Number(row.password_changed_at) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function rowToSession(row) {
  if (!row) return null;
  return {
    token: row.token,
    userId: row.user_id,
    createdAt: Number(row.created_at),
    lastSeenAt: Number(row.last_seen_at),
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    revokedAt: row.revoked_at ? Number(row.revoked_at) : null
  };
}

function rowToAuthToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    tokenDigest: row.token_digest,
    expiresAt: Number(row.expires_at),
    usedAt: row.used_at ? Number(row.used_at) : null,
    createdAt: Number(row.created_at)
  };
}

function rowToHistoryRecord(row) {
  return {
    id: row.id,
    roomCode: row.room_code,
    finishedAt: Number(row.finished_at),
    won: row.won,
    winnerName: row.winner_name,
    playerName: row.player_name,
    professionId: row.profession_id,
    profession: row.profession,
    finishReason: row.finish_reason,
    victoryMode: row.victory_mode,
    gameLength: row.game_length,
    turnCount: row.turn_count,
    round: row.round,
    playerCount: row.player_count,
    netWorth: row.net_worth,
    cash: row.cash,
    passiveIncome: row.passive_income,
    projectIncome: row.project_income,
    projectAssets: row.project_assets,
    bankruptcyCount: row.bankruptcy_count,
    finalRank: row.final_rank,
    capitalTimeline: row.capital_timeline || [],
    reputation: row.reputation
  };
}

module.exports = {
  initDb,
  closeDb,
  findUserById,
  findUserByEmail,
  insertUser,
  updateUserName,
  updateUserPassword,
  verifyUserEmail,
  insertSession,
  findSession,
  touchSession,
  deleteSession,
  revokeSession,
  revokeUserSessions,
  insertAuthToken,
  findAuthToken,
  markAuthTokenUsed,
  deleteUserAuthTokens,
  loadRooms,
  saveRoom,
  saveRooms,
  addHistoryRecords,
  getUserHistory,
  getUserStats,
  healthCheck
};
