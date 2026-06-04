const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://cashflow:cashflow@localhost:15432/cashflow_online";
const pool = new Pool({
  connectionString: DATABASE_URL
});

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
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
    `INSERT INTO users (id, name, email, password, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, user.name, user.email, user.password, user.createdAt, user.updatedAt]
  );
}

async function updateUserName(id, name, updatedAt) {
  await pool.query(
    "UPDATE users SET name = $2, updated_at = $3 WHERE id = $1",
    [id, name, updatedAt]
  );
}

async function insertSession(session) {
  await pool.query(
    `INSERT INTO sessions (token, user_id, created_at, last_seen_at)
     VALUES ($1, $2, $3, $4)`,
    [session.token, session.userId, session.createdAt, session.lastSeenAt]
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
          (id, user_id, room_code, won, winner_name, player_name, net_worth, cash, passive_income,
           project_income, project_assets, reputation, finished_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          record.id,
          record.userId,
          record.roomCode,
          record.won,
          record.winnerName,
          record.playerName,
          record.netWorth,
          record.cash,
          record.passiveIncome,
          record.projectIncome,
          record.projectAssets,
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
       COALESCE(MAX(project_income), 0)::int AS best_project_income
     FROM game_history
     WHERE user_id = $1`,
    [userId]
  );
  const row = result.rows[0] || {};
  return {
    games: row.games || 0,
    wins: row.wins || 0,
    bestNetWorth: row.best_net_worth || 0,
    bestPassiveIncome: row.best_passive_income || 0,
    bestProjectIncome: row.best_project_income || 0
  };
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
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
    lastSeenAt: Number(row.last_seen_at)
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
    netWorth: row.net_worth,
    cash: row.cash,
    passiveIncome: row.passive_income,
    projectIncome: row.project_income,
    projectAssets: row.project_assets,
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
  insertSession,
  findSession,
  touchSession,
  deleteSession,
  loadRooms,
  saveRoom,
  saveRooms,
  addHistoryRecords,
  getUserHistory,
  getUserStats
};
