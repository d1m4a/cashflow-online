const test = require("node:test");
const assert = require("node:assert/strict");
const { Pool } = require("pg");
const WebSocket = require("ws");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  test("API integration tests require TEST_DATABASE_URL", { skip: "Set TEST_DATABASE_URL to run Postgres-backed API tests." }, () => {});
} else {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.EMAIL_DEV_MODE = "true";
  process.env.LOG_LEVEL = "error";

  let app;
  let db;
  let baseUrl;

  test.before(async () => {
    await resetDatabase(TEST_DATABASE_URL);
    app = require("../backend/server");
    db = require("../backend/db");
    const instance = await app.startServer(0);
    baseUrl = `http://127.0.0.1:${instance.address().port}`;
  });

  test.after(async () => {
    await app.stopServer();
  });

  test("auth flow sets a protected session cookie and exposes current user", async () => {
    const registered = await request("/api/auth/register", {
      method: "POST",
      body: {
        email: "alice@example.com",
        name: "Alice",
        password: "secret1"
      }
    });

    assert.equal(registered.status, 201);
    assert.equal(registered.body.user.email, "alice@example.com");
    assert.match(registered.cookie, /meshok_session=/);
    assert.match(registered.cookie, /HttpOnly/);
    assert.match(registered.cookie, /SameSite=Lax/);

    const me = await request("/api/me", { cookie: registered.cookie });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "alice@example.com");

    const logout = await request("/api/auth/logout", {
      method: "POST",
      cookie: registered.cookie
    });
    assert.equal(logout.status, 200);
    assert.match(logout.cookie, /Max-Age=0/);
  });

  test("authenticated users can create and list rooms", async () => {
    const alice = await register("rooms-alice@example.com", "Alice");
    const created = await request("/api/rooms", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "API Test Room",
        privacy: "public",
        professionId: "event-host"
      }
    });

    assert.equal(created.status, 201);
    assert.match(created.body.roomCode, /^[A-Z0-9]{8}$/);
    assert.equal(created.body.game.title, "API Test Room");
    assert.equal(created.body.game.privacy, "public");

    const rooms = await request("/api/rooms", { cookie: alice.cookie });
    assert.equal(rooms.status, 200);
    assert.ok(rooms.body.rooms.some((room) => room.roomCode === created.body.roomCode));
  });

  test("private rooms reject unrelated users", async () => {
    const alice = await register("private-alice@example.com", "Alice");
    const bob = await register("private-bob@example.com", "Bob");
    const created = await request("/api/rooms", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "Private API Room",
        privacy: "private",
        professionId: "event-host"
      }
    });

    const forbidden = await request(`/api/rooms/${created.body.roomCode}`, { cookie: bob.cookie });

    assert.equal(forbidden.status, 403);
  });

  test("room websocket can reconnect and receive state", async () => {
    const alice = await register("ws-alice@example.com", "Alice");
    const created = await request("/api/rooms", {
      method: "POST",
      cookie: alice.cookie,
      body: {
        title: "Reconnect Room",
        privacy: "private",
        professionId: "event-host"
      }
    });
    const wsUrl = websocketUrl(created.body.roomCode, created.body.playerId);

    const firstState = await readFirstSocketState(wsUrl, alice.cookie);
    assert.equal(firstState.game.roomCode, created.body.roomCode);
    assert.equal(firstState.presence.players[0].connected, true);

    const secondState = await readFirstSocketState(wsUrl, alice.cookie);
    assert.equal(secondState.game.roomCode, created.body.roomCode);
    assert.equal(secondState.game.players[0].id, created.body.playerId);
  });

  test("finished games can be recorded into user history", async () => {
    const { createGame, startGame, buyGrandGoal } = require("../shared/gameRules");
    const { _test } = require("../backend/server");

    const user = {
      id: "history-user",
      name: "History Alice",
      email: "history@example.com",
      password: { salt: "salt", digest: "digest" },
      emailVerifiedAt: Date.now(),
      passwordChangedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.insertUser(user);

    const game = createGame("HIST1", user.name, "event-host", user.id);
    startGame(game, game.hostId);
    const player = game.players[0];
    player.track = "project-league";
    player.cash = player.grandGoal.cost;
    buyGrandGoal(game, player.id);

    await _test.recordFinishedGame(game);
    const history = await db.getUserHistory(user.id, 5);
    const stats = await db.getUserStats(user.id);

    assert.equal(history.length, 1);
    assert.equal(history[0].roomCode, "HIST1");
    assert.equal(history[0].won, true);
    assert.equal(history[0].finishReason, "goal");
    assert.equal(stats.games, 1);
    assert.equal(stats.wins, 1);
  });

  test("a spoofed X-Forwarded-For cannot buy extra login attempts", async () => {
    const statuses = [];
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await request("/api/auth/login", {
        method: "POST",
        headers: { "X-Forwarded-For": `203.0.113.${attempt}` },
        body: { email: "nobody@example.com", password: "wrong-password" }
      });
      statuses.push(response.status);
      if (response.status === 429) {
        break;
      }
    }

    assert.ok(
      statuses.includes(429),
      "rate limit must key on the real peer, not on a client supplied header"
    );
  });

  test("password reset reports that email delivery is unavailable", async () => {
    const response = await request("/api/auth/request-password-reset", {
      method: "POST",
      body: { email: "alice@example.com" }
    });
    // EMAIL_DEV_MODE is on in tests, so the endpoint still works but must never
    // claim a message was sent.
    assert.equal(response.status, 200);
    assert.notEqual(response.body.passwordReset?.sent, true);
  });

  test("expired sessions and used tokens are swept out of the database", async () => {
    const user = await register("sweep@example.com", "Sweep");
    const me = await request("/api/me", { cookie: user.cookie });
    assert.equal(me.body.user.email, "sweep@example.com");

    const token = /meshok_session=([^;]+)/.exec(user.cookie)[1];
    const pool = new Pool({ connectionString: TEST_DATABASE_URL });
    try {
      await pool.query("UPDATE sessions SET expires_at = $2 WHERE token = $1", [
        decodeURIComponent(token),
        Date.now() - 1000
      ]);
      const removed = await db.cleanupExpired();
      assert.ok(removed.sessions >= 1, "the expired session must be deleted");

      const after = await pool.query("SELECT 1 FROM sessions WHERE token = $1", [decodeURIComponent(token)]);
      assert.equal(after.rowCount, 0);
    } finally {
      await pool.end();
    }
  });

  test("archived rooms are evicted from memory but kept in the database", async () => {
    const { _test } = require("../backend/server");
    const host = await register("evict@example.com", "Evictor");
    const created = await request("/api/rooms", {
      method: "POST",
      cookie: host.cookie,
      body: { name: "Evictor", professionId: "event-host" }
    });
    const roomCode = created.body.roomCode;

    const archived = await request(`/api/rooms/${roomCode}/archive`, {
      method: "POST",
      cookie: host.cookie,
      body: { playerId: created.body.playerId }
    });
    assert.equal(archived.status, 200);
    assert.equal(_test.rooms.has(roomCode), true, "still resident right after archiving");

    _test.evictArchivedRooms();
    assert.equal(_test.rooms.has(roomCode), false, "evicted from memory");

    const pool = new Pool({ connectionString: TEST_DATABASE_URL });
    try {
      const row = await pool.query("SELECT archived_at FROM rooms WHERE room_code = $1", [roomCode]);
      assert.equal(row.rowCount, 1, "row is retained in Postgres");
      assert.ok(Number(row.rows[0].archived_at) > 0, "archived_at is queryable outside the JSONB blob");
    } finally {
      await pool.end();
    }
  });

  async function register(email, name) {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: { email, name, password: "secret1" }
    });
    assert.equal(response.status, 201);
    return response;
  }

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (options.cookie) {
      headers.Cookie = sessionCookie(options.cookie);
    }
    Object.assign(headers, options.headers || {});

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
      cookie: response.headers.get("set-cookie") || options.cookie || ""
    };
  }

  function websocketUrl(roomCode, playerId) {
    const url = new URL(baseUrl);
    url.protocol = "ws:";
    url.pathname = "/ws";
    url.searchParams.set("room", roomCode);
    url.searchParams.set("playerId", playerId);
    return url.toString();
  }

  function readFirstSocketState(url, cookie) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        headers: {
          Cookie: sessionCookie(cookie)
        }
      });
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error("Timed out waiting for websocket state."));
      }, 3000);

      ws.on("message", (raw) => {
        const message = JSON.parse(raw.toString());
        if (message.event === "state") {
          clearTimeout(timeout);
          ws.close();
          resolve(message);
        }
      });
      ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}

async function resetDatabase(databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("CREATE SCHEMA public");
  } finally {
    await pool.end();
  }
}

function sessionCookie(rawCookie) {
  return String(rawCookie).split(";")[0];
}
