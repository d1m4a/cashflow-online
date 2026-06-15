const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const WebSocket = require("ws");
const db = require("./db");
const {
  createGame,
  addPlayer,
  addSpectator,
  setPlayerReady,
  startGame,
  restartGame,
  kickPlayer,
  updateRoomSettings,
  transferHost,
  leaveRoom,
  archiveRoom,
  takeTurn,
  drawOpportunity,
  buyOpportunity,
  passOpportunity,
  passOpportunityChoice,
  repayLiability,
  buyGrandGoal,
  buyProjectDeal,
  passProjectDeal,
  acceptMarketOffer,
  declineMarketOffer,
  confirmFinancialStress,
  addChatMessage,
  serializeGame,
  serializeRules,
  makeRoomCode
} = require("../shared/gameRules");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const rooms = new Map();
const roomSockets = new Map();
const authAttempts = new Map();
const WS_HEARTBEAT_MS = Number(process.env.WS_HEARTBEAT_MS || 30_000);
const AUTH_RATE_WINDOW_MS = Number(process.env.AUTH_RATE_WINDOW_MS || 60_000);
const AUTH_RATE_MAX = Number(process.env.AUTH_RATE_MAX || 12);
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS || 30 * 24 * 60 * 60 * 1000);
const SESSION_IDLE_MS = Number(process.env.SESSION_IDLE_MS || 7 * 24 * 60 * 60 * 1000);
const EMAIL_TOKEN_TTL_MS = Number(process.env.EMAIL_TOKEN_TTL_MS || 24 * 60 * 60 * 1000);
const PASSWORD_RESET_TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MS || 60 * 60 * 1000);
const EMAIL_DEV_MODE = process.env.EMAIL_DEV_MODE !== "false";

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    handleUnexpectedError(res, error);
  }
});
const wsServer = new WebSocket.Server({ noServer: true });

server.on("upgrade", async (req, socket, head) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const user = await currentUser(req);
    const roomCode = String(url.searchParams.get("room") || "").trim().toUpperCase();
    const game = rooms.get(roomCode);
    if (!user || !game || !canReadRoom(game, user.id)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wsServer.handleUpgrade(req, socket, head, (ws) => {
      wsServer.emit("connection", ws, req, { game, user, url });
    });
  } catch (error) {
    console.error("WebSocket upgrade failed:", error);
    socket.destroy();
  }
});

wsServer.on("connection", (ws, req, context) => {
  attachRoomSocket(ws, context.game, context.user, context.url);
});

const heartbeatTimer = setInterval(() => {
  for (const ws of wsServer.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, WS_HEARTBEAT_MS);

wsServer.on("close", () => {
  clearInterval(heartbeatTimer);
});

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function startServer(port = PORT) {
  await db.initDb();
  await loadRooms();
  return new Promise((resolve) => {
    const instance = server.listen(port, () => {
      console.log(`Мешок Деняк is running at http://localhost:${port}`);
      resolve(instance);
    });
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    try {
      await db.healthCheck();
      sendJson(res, 200, { ok: true, database: "ok" });
    } catch (error) {
      console.error("Healthcheck failed:", error);
      sendJson(res, 503, { ok: false, database: "error" });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/rules") {
    sendJson(res, 200, serializeRules());
    return;
  }

  if (url.pathname.startsWith("/api/auth") || url.pathname === "/api/me") {
    await handleAuthApi(req, res, url);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/rooms") {
    const user = await requireUser(req, res);
    if (!user) return;
    sendJson(res, 200, { rooms: listRoomsForUser(user.id) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = await readJson(req);
    const code = uniqueRoomCode();
    const game = createGame(code, body.name || user.name, body.professionId, user.id, {
      title: body.title,
      privacy: body.privacy,
      maxPlayers: body.maxPlayers,
      gameLength: body.gameLength,
      victoryMode: body.victoryMode
    });
    rooms.set(code, game);
    await persistGame(game);
    sendJson(res, 201, {
      roomCode: code,
      playerId: game.players[0].id,
      game: serializeGame(game)
    });
    return;
  }

  const match = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{5})(?:\/([a-z-]+))?$/);
  if (!match) {
    sendJson(res, 404, { error: "Маршрут не найден." });
    return;
  }

  const roomCode = match[1];
  const action = match[2] || "";
  const game = rooms.get(roomCode);
  if (!game) {
    sendJson(res, 404, { error: "Комната не найдена." });
    return;
  }

  if (req.method === "GET" && !action) {
    const user = await requireUser(req, res);
    if (!user || !canReadRoom(game, user.id)) return;
    sendJson(res, 200, roomPayload(game));
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Метод не поддерживается." });
    return;
  }

  const body = await readJson(req);
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (action === "join") {
      const player = addPlayer(game, body.name || user.name, body.professionId, user.id);
      await persistGame(game);
      const payload = { playerId: player.id, game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "join");
      return;
    }

    if (action === "spectate") {
      const spectator = addSpectator(game, body.name || user.name, user.id);
      await persistGame(game);
      const payload = { spectatorId: spectator.id, game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "join");
      return;
    }

    if (action === "leave") {
      const participantId = body.playerId || body.spectatorId;
      if (!canActAsParticipant(game, user.id, participantId)) {
        sendJson(res, 403, { error: "Нельзя управлять другим участником." });
        return;
      }
      leaveRoom(game, participantId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "leave");
      return;
    }

    if (game.archivedAt) {
      sendJson(res, 400, { error: "Комната архивирована." });
      return;
    }

    if (!canActAsPlayer(game, user.id, body.playerId)) {
      sendJson(res, 403, { error: "Нельзя управлять другим игроком." });
      return;
    }

    if (action === "settings") {
      updateRoomSettings(game, body.playerId, {
        title: body.title,
        privacy: body.privacy,
        maxPlayers: body.maxPlayers,
        gameLength: body.gameLength,
        victoryMode: body.victoryMode
      });
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "transfer-host") {
      transferHost(game, body.playerId, body.targetPlayerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "archive") {
      archiveRoom(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "ready") {
      setPlayerReady(game, body.playerId, body.ready);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "ready");
      return;
    }

    if (action === "start") {
      startGame(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "restart") {
      await recordFinishedGame(game);
      restartGame(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "kick") {
      kickPlayer(game, body.playerId, body.targetPlayerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "turn") {
      takeTurn(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "draw-opportunity") {
      drawOpportunity(game, body.playerId, body.type);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "turn");
      return;
    }

    if (action === "buy") {
      buyOpportunity(game, body.playerId, body.mode);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "pass") {
      if (body.kind === "opportunity-choice") {
        passOpportunityChoice(game, body.playerId);
      } else {
        passOpportunity(game, body.playerId);
      }
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "repay-liability") {
      repayLiability(game, body.playerId, body.liabilityId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "complete-goal") {
      buyGrandGoal(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "buy-project") {
      buyProjectDeal(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "pass-project") {
      passProjectDeal(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "accept-market") {
      acceptMarketOffer(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "decline-market") {
      declineMarketOffer(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "confirm-financial-stress") {
      confirmFinancialStress(game, body.playerId);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    if (action === "chat") {
      addChatMessage(game, body.playerId, body.text);
      await persistGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game, "room:update");
      return;
    }

    sendJson(res, 404, { error: "Действие не найдено." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function handleAuthApi(req, res, url) {
  if (req.method === "POST" && (
    url.pathname === "/api/auth/register" ||
    url.pathname === "/api/auth/login" ||
    url.pathname === "/api/auth/request-password-reset"
  )) {
    if (!checkRateLimit(req, res, url.pathname)) {
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = await currentUser(req);
    sendJson(res, 200, { user: user ? await serializeUser(user) : null });
    return;
  }

  if (req.method === "PATCH" && url.pathname === "/api/me") {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = await readJson(req);
    const name = normalizeName(body.name);
    if (!name) {
      sendJson(res, 400, { error: "Имя не может быть пустым." });
      return;
    }
    const updatedAt = Date.now();
    user.name = name;
    user.updatedAt = updatedAt;
    for (const room of rooms.values()) {
      for (const player of room.players) {
        if (player.accountId === user.id) {
          player.name = name;
        }
      }
    }
    await db.updateUserName(user.id, name, updatedAt);
    await db.saveRooms([...rooms.values()]);
    broadcastRoomsForUser(user.id);
    sendJson(res, 200, { user: await serializeUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const name = normalizeName(body.name);
    const password = String(body.password || "");
    if (!email || !name || password.length < 6) {
      sendJson(res, 400, { error: "Нужны имя, email и пароль от 6 символов." });
      return;
    }
    if (await db.findUserByEmail(email)) {
      sendJson(res, 400, { error: "Пользователь с таким email уже есть." });
      return;
    }
    const user = createUser(name, email, password);
    await db.insertUser(user);
    const verification = await createAuthToken(user.id, "email_verification", EMAIL_TOKEN_TTL_MS);
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    sendJson(res, 201, {
      user: await serializeUser(user),
      emailVerification: devTokenPayload(req, "/api/auth/verify-email", verification)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/resend-verification") {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.emailVerifiedAt) {
      sendJson(res, 200, { ok: true, alreadyVerified: true });
      return;
    }
    await db.deleteUserAuthTokens(user.id, "email_verification");
    const verification = await createAuthToken(user.id, "email_verification", EMAIL_TOKEN_TTL_MS);
    sendJson(res, 200, {
      ok: true,
      emailVerification: devTokenPayload(req, "/api/auth/verify-email", verification)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/verify-email") {
    const body = await readJson(req);
    const result = await consumeAuthToken("email_verification", body.token);
    if (!result.ok) {
      sendJson(res, 400, { error: result.error });
      return;
    }
    const now = Date.now();
    await db.verifyUserEmail(result.token.userId, now);
    const user = await db.findUserById(result.token.userId);
    sendJson(res, 200, { ok: true, user: user ? await serializeUser(user) : null });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const user = await db.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password)) {
      sendJson(res, 401, { error: "Неверный email или пароль." });
      return;
    }
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    sendJson(res, 200, { user: await serializeUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = sessionToken(req);
    if (token) {
      await db.deleteSession(token);
    }
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout-all") {
    const user = await requireUser(req, res);
    if (!user) return;
    const token = sessionToken(req);
    await db.revokeUserSessions(user.id, Date.now());
    clearSessionCookie(res);
    if (token) {
      await db.deleteSession(token);
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/change-password") {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = await readJson(req);
    const currentPassword = String(body.currentPassword || "");
    const nextPassword = String(body.nextPassword || "");
    if (!verifyPassword(currentPassword, user.password)) {
      sendJson(res, 400, { error: "Текущий пароль неверный." });
      return;
    }
    if (nextPassword.length < 6) {
      sendJson(res, 400, { error: "Новый пароль должен быть от 6 символов." });
      return;
    }
    const now = Date.now();
    await db.updateUserPassword(user.id, hashPassword(nextPassword), now);
    await db.revokeUserSessions(user.id, now, sessionToken(req));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/request-password-reset") {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const user = email ? await db.findUserByEmail(email) : null;
    if (!user) {
      sendJson(res, 200, { ok: true });
      return;
    }
    await db.deleteUserAuthTokens(user.id, "password_reset");
    const reset = await createAuthToken(user.id, "password_reset", PASSWORD_RESET_TTL_MS);
    sendJson(res, 200, {
      ok: true,
      passwordReset: devTokenPayload(req, "/api/auth/reset-password", reset)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/reset-password") {
    const body = await readJson(req);
    const nextPassword = String(body.nextPassword || "");
    if (nextPassword.length < 6) {
      sendJson(res, 400, { error: "Новый пароль должен быть от 6 символов." });
      return;
    }
    const result = await consumeAuthToken("password_reset", body.token);
    if (!result.ok) {
      sendJson(res, 400, { error: result.error });
      return;
    }
    const now = Date.now();
    await db.updateUserPassword(result.token.userId, hashPassword(nextPassword), now);
    await db.revokeUserSessions(result.token.userId, now);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "Маршрут не найден." });
}

function attachRoomSocket(ws, game, user, url) {
  const roomCode = game.roomCode;
  const playerId = String(url.searchParams.get("playerId") || "");
  const spectatorId = String(url.searchParams.get("spectatorId") || "");
  let sockets = roomSockets.get(roomCode);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(roomCode, sockets);
  }

  ws.isAlive = true;
  ws.roomCode = roomCode;
  ws.userId = user.id;
  ws.playerId = canActAsPlayer(game, user.id, playerId) ? playerId : null;
  ws.spectatorId = game.spectators?.some((item) => item.id === spectatorId && item.accountId === user.id) ? spectatorId : null;
  ws.connectedAt = Date.now();
  ws.lastSeenAt = ws.connectedAt;
  sockets.add(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
    ws.lastSeenAt = Date.now();
  });
  ws.on("message", (raw) => {
    handleSocketMessage(ws, raw);
  });
  ws.on("close", () => {
    ws.lastSeenAt = Date.now();
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(roomCode);
    }
    const currentGame = rooms.get(roomCode);
    if (currentGame) {
      broadcastRoom(currentGame, "presence");
    }
  });

  sendSocket(ws, "state", roomPayload(game));
  broadcastRoom(game, "presence");
}

function handleSocketMessage(ws, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return;
  }
  ws.lastSeenAt = Date.now();
  if (message.type === "pong" || message.type === "heartbeat") {
    ws.isAlive = true;
    sendSocket(ws, "heartbeat", { ok: true, at: Date.now() });
  }
}

function broadcastRoom(game, event = "room:update") {
  const sockets = roomSockets.get(game.roomCode);
  if (!sockets || sockets.size === 0) {
    return;
  }

  const payload = roomPayload(game);
  for (const socket of sockets) {
    sendSocket(socket, event, payload);
  }
}

function broadcastRoomsForUser(userId) {
  for (const game of rooms.values()) {
    if (game.players.some((player) => player.accountId === userId) || game.spectators?.some((spectator) => spectator.accountId === userId)) {
      broadcastRoom(game, "room:update");
    }
  }
}

function sendSocket(ws, event, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(JSON.stringify({ event, ...payload }));
}

function roomPayload(game) {
  return {
    game: serializeGame(game),
    presence: roomPresence(game)
  };
}

function roomPresence(game) {
  const sockets = [...(roomSockets.get(game.roomCode) || [])].filter((ws) => ws.readyState === WebSocket.OPEN);
  const playerConnections = new Map();
  const spectatorConnections = new Map();
  for (const ws of sockets) {
    if (ws.playerId) {
      playerConnections.set(ws.playerId, Math.max(playerConnections.get(ws.playerId) || 0, ws.lastSeenAt || ws.connectedAt || Date.now()));
    }
    if (ws.spectatorId) {
      spectatorConnections.set(ws.spectatorId, Math.max(spectatorConnections.get(ws.spectatorId) || 0, ws.lastSeenAt || ws.connectedAt || Date.now()));
    }
  }
  return {
    players: game.players.map((player) => ({
      id: player.id,
      connected: playerConnections.has(player.id),
      lastSeenAt: playerConnections.get(player.id) || null
    })),
    spectators: (game.spectators || []).map((spectator) => ({
      id: spectator.id,
      connected: spectatorConnections.has(spectator.id),
      lastSeenAt: spectatorConnections.get(spectator.id) || null
    }))
  };
}

function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(FRONTEND_DIR, pathname));

  if (!filePath.startsWith(FRONTEND_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    }[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

function uniqueRoomCode() {
  let code = makeRoomCode();
  while (rooms.has(code)) {
    code = makeRoomCode();
  }
  return code;
}

async function loadRooms() {
  const savedRooms = await db.loadRooms();
  rooms.clear();
  for (const room of savedRooms) {
    if (room && typeof room.roomCode === "string" && Array.isArray(room.players)) {
      if (!room.hostId && room.players[0]) {
        room.hostId = room.players[0].id;
      }
      serializeGame(room);
      rooms.set(room.roomCode, room);
    }
  }
  console.log(`Loaded ${rooms.size} saved room(s).`);
}

async function persistGame(game) {
  await recordFinishedGame(game);
  await db.saveRoom(game);
}

function createUser(name, email, password) {
  const now = Date.now();
  return {
    id: makeId(),
    name,
    email,
    password: hashPassword(password),
    emailVerifiedAt: null,
    passwordChangedAt: now,
    createdAt: now,
    updatedAt: now
  };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  await db.insertSession({
    token,
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS
  });
  return token;
}

async function currentUser(req) {
  const token = sessionToken(req);
  if (!token) {
    return null;
  }
  const session = await db.findSession(token);
  if (!session) {
    return null;
  }
  const now = Date.now();
  if (session.revokedAt || (session.expiresAt && session.expiresAt <= now) || now - session.lastSeenAt > SESSION_IDLE_MS) {
    await db.deleteSession(token);
    return null;
  }
  await db.touchSession(token, now);
  return db.findUserById(session.userId);
}

async function requireUser(req, res) {
  const user = await currentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Нужно войти в аккаунт." });
    return null;
  }
  return user;
}

async function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt,
    stats: await db.getUserStats(user.id),
    history: await db.getUserHistory(user.id, 20),
    rooms: savedRoomsForUser(user.id)
  };
}

async function createAuthToken(userId, kind, ttlMs) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const token = {
    id: makeId(),
    userId,
    kind,
    token: rawToken,
    tokenDigest: digestToken(rawToken),
    expiresAt: now + ttlMs,
    createdAt: now
  };
  await db.insertAuthToken(token);
  return token;
}

async function consumeAuthToken(kind, rawToken) {
  const tokenValue = String(rawToken || "").trim();
  if (!tokenValue) {
    return { ok: false, error: "Токен не указан." };
  }
  const token = await db.findAuthToken(kind, digestToken(tokenValue));
  if (!token || token.usedAt) {
    return { ok: false, error: "Токен недействителен." };
  }
  if (token.expiresAt <= Date.now()) {
    return { ok: false, error: "Срок действия токена истёк." };
  }
  await db.markAuthTokenUsed(token.id, Date.now());
  return { ok: true, token };
}

function devTokenPayload(req, apiPath, token) {
  if (!EMAIL_DEV_MODE) {
    return { sent: true };
  }
  const origin = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
  return {
    sent: false,
    token: token.token,
    url: `${origin}/#${apiPath}?token=${encodeURIComponent(token.token)}`
  };
}

function digestToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function savedRoomsForUser(userId) {
  return [...rooms.values()]
    .filter((game) => game.players.some((player) => player.accountId === userId))
    .map((game) => ({
      roomCode: game.roomCode,
      title: game.title || `Комната ${game.roomCode}`,
      privacy: game.privacy || "private",
      status: game.status,
      archived: Boolean(game.archivedAt),
      host: game.players.find((player) => player.id === game.hostId)?.name || "Хост",
      players: game.players.map((player) => player.name),
      playerId: game.players.find((player) => player.accountId === userId)?.id || null,
      updatedAt: game.updatedAt,
      createdAt: game.createdAt
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function listRoomsForUser(userId) {
  return [...rooms.values()]
    .map((game) => roomSummaryForUser(game, userId))
    .filter((room) => !room.archived && (room.privacy === "public" || room.isPlayer || room.isSpectator))
    .sort((a, b) => {
      if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1;
      if (a.privacy !== b.privacy) return a.privacy === "public" ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
}

function roomSummaryForUser(game, userId) {
  const player = game.players.find((item) => item.accountId === userId);
  const spectator = game.spectators?.find((item) => item.accountId === userId);
  const host = game.players.find((item) => item.id === game.hostId);
  return {
    roomCode: game.roomCode,
    title: game.title || `Комната ${game.roomCode}`,
    privacy: game.privacy || "private",
    status: game.status,
    archived: Boolean(game.archivedAt),
    host: host?.name || "Хост",
    maxPlayers: game.maxPlayers || 4,
    playerCount: game.players.length,
    spectatorCount: game.spectators?.length || 0,
    players: game.players.map((item) => item.name),
    playerId: player?.id || null,
    spectatorId: spectator?.id || null,
    isPlayer: Boolean(player),
    isSpectator: Boolean(spectator),
    createdAt: game.createdAt,
    updatedAt: game.updatedAt
  };
}

async function recordFinishedGame(game) {
  if (game.status !== "finished" || game.resultRecordedAt) {
    return;
  }

  const finishedAt = Date.now();
  const winner = game.players.find((player) => player.id === game.winnerId);
  const rankedPlayers = [...game.players]
    .map((player) => ({ player, netWorth: playerNetWorth(player) }))
    .sort((a, b) => b.netWorth - a.netWorth);
  const rankByPlayerId = new Map(rankedPlayers.map((item, index) => [item.player.id, index + 1]));
  const records = [];
  for (const player of game.players) {
    if (!player.accountId) {
      continue;
    }
    const netWorth = playerNetWorth(player);
    const won = player.id === game.winnerId;
    records.push({
      id: makeId(),
      userId: player.accountId,
      roomCode: game.roomCode,
      finishedAt,
      won,
      winnerName: winner?.name || "Игрок",
      playerName: player.name,
      professionId: player.professionId,
      profession: player.profession,
      finishReason: game.finishReason || "unknown",
      victoryMode: game.settings?.victoryMode || "classic",
      gameLength: game.settings?.gameLength || "open",
      turnCount: game.turnCount || 0,
      round: game.round || 1,
      playerCount: game.players.length,
      netWorth,
      cash: player.cash,
      passiveIncome: player.passiveIncome,
      projectIncome: player.projectIncome || 0,
      projectAssets: player.assets.filter((asset) => asset.type === "project-league").length,
      bankruptcyCount: player.bankruptcyCount || 0,
      finalRank: rankByPlayerId.get(player.id) || 1,
      capitalTimeline: capitalTimelineForPlayer(game, player),
      reputation: player.reputation || 0
    });
  }
  game.resultRecordedAt = finishedAt;
  await db.addHistoryRecords(game, records);
}

function playerNetWorth(player) {
  const assetValue = player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0);
  const liabilities = player.liabilities.reduce((sum, liability) => sum + (liability.balance || 0), 0);
  return player.cash + assetValue - liabilities;
}

function capitalTimelineForPlayer(game, player) {
  const snapshots = Array.isArray(game.historySnapshots) ? game.historySnapshots : [];
  const timeline = snapshots
    .map((snapshot) => {
      const row = snapshot.players?.find((item) => item.id === player.id);
      if (!row) {
        return null;
      }
      return {
        kind: snapshot.kind || "turn",
        turnCount: snapshot.turnCount || 0,
        round: snapshot.round || 1,
        createdAt: snapshot.createdAt || game.updatedAt || Date.now(),
        netWorth: row.netWorth,
        cash: row.cash,
        passiveIncome: row.passiveIncome,
        projectIncome: row.projectIncome || 0,
        projectAssets: row.projectAssets || 0,
        bankruptcyCount: row.bankruptcyCount || 0
      };
    })
    .filter(Boolean);

  if (timeline.length > 0) {
    return timeline;
  }

  return [{
    kind: "finish",
    turnCount: game.turnCount || 0,
    round: game.round || 1,
    createdAt: game.updatedAt || Date.now(),
    netWorth: playerNetWorth(player),
    cash: player.cash,
    passiveIncome: player.passiveIncome,
    projectIncome: player.projectIncome || 0,
    projectAssets: player.assets.filter((asset) => asset.type === "project-league").length,
    bankruptcyCount: player.bankruptcyCount || 0
  }];
}

function canReadRoom(game, userId) {
  if (!game.archivedAt && game.privacy === "public") {
    return true;
  }
  return game.players.some((player) => player.accountId === userId)
    || game.spectators?.some((spectator) => spectator.accountId === userId);
}

function canActAsPlayer(game, userId, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  return Boolean(player && player.accountId === userId);
}

function canActAsParticipant(game, userId, participantId) {
  return canActAsPlayer(game, userId, participantId)
    || Boolean(game.spectators?.some((item) => item.id === participantId && item.accountId === userId));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { salt, digest };
}

function verifyPassword(password, stored) {
  if (!stored?.salt || !stored?.digest) {
    return false;
  }
  const digest = crypto.pbkdf2Sync(password, stored.salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(stored.digest, "hex"));
}

function sessionToken(req) {
  return parseCookies(req.headers.cookie || "").meshok_session || "";
}

function parseCookies(raw) {
  return raw.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 0) return cookies;
    const key = decodeURIComponent(part.slice(0, index).trim());
    const value = decodeURIComponent(part.slice(index + 1).trim());
    cookies[key] = value;
    return cookies;
  }, {});
}

function setSessionCookie(res, token) {
  const secure = process.env.SESSION_COOKIE_SECURE === "true" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `meshok_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "meshok_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

function checkRateLimit(req, res, scope) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  const bucket = authAttempts.get(key) || { count: 0, resetAt: now + AUTH_RATE_WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + AUTH_RATE_WINDOW_MS;
  }

  bucket.count += 1;
  authAttempts.set(key, bucket);

  if (bucket.count <= AUTH_RATE_MAX) {
    return true;
  }

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  res.writeHead(429, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": String(retryAfter)
  });
  res.end(JSON.stringify({ error: "Слишком много попыток. Попробуй позже.", retryAfter }));
  return false;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function handleUnexpectedError(res, error) {
  console.error(error);
  if (res.headersSent) {
    res.end();
    return;
  }
  const status = isDatabaseError(error) ? 503 : 500;
  const message = status === 503 ? "База данных временно недоступна." : "Внутренняя ошибка сервера.";
  sendJson(res, status, { error: message });
}

function isDatabaseError(error) {
  return Boolean(error?.code || error?.severity || error?.routine);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase().slice(0, 120);
}

function normalizeName(name) {
  return String(name || "").trim().slice(0, 24);
}

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Слишком большой запрос."));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Некорректный JSON."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(text);
}

module.exports = {
  server,
  startServer
};
