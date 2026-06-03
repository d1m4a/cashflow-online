const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  createGame,
  addPlayer,
  setPlayerReady,
  startGame,
  restartGame,
  kickPlayer,
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
  addChatMessage,
  serializeGame,
  serializeRules,
  makeRoomCode
} = require("../shared/gameRules");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const DATA_DIR = path.join(__dirname, "data");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const rooms = new Map();
const roomStreams = new Map();
const users = new Map();
const sessions = new Map();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: "Внутренняя ошибка сервера." });
    console.error(error);
  }
});

if (require.main === module) {
  startServer();
}

function startServer(port = PORT) {
  loadUsers();
  loadRooms();
  return server.listen(port, () => {
    console.log(`Мешок Деняк is running at http://localhost:${port}`);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/rules") {
    sendJson(res, 200, serializeRules());
    return;
  }

  if (url.pathname.startsWith("/api/auth") || url.pathname === "/api/me") {
    await handleAuthApi(req, res, url);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const user = requireUser(req, res);
    if (!user) return;
    const body = await readJson(req);
    const code = uniqueRoomCode();
    const game = createGame(code, body.name || user.name, body.professionId, user.id);
    rooms.set(code, game);
    saveRooms();
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

  if (req.method === "GET" && action === "events") {
    const user = requireUser(req, res);
    if (!user || !canReadRoom(game, user.id)) return;
    subscribeToRoom(req, res, game);
    return;
  }

  if (req.method === "GET" && !action) {
    const user = requireUser(req, res);
    if (!user || !canReadRoom(game, user.id)) return;
    sendJson(res, 200, { game: serializeGame(game) });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Метод не поддерживается." });
    return;
  }

  const body = await readJson(req);
  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (action === "join") {
      const player = addPlayer(game, body.name || user.name, body.professionId, user.id);
      const payload = { playerId: player.id, game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (!canActAsPlayer(game, user.id, body.playerId)) {
      sendJson(res, 403, { error: "Нельзя управлять другим игроком." });
      return;
    }

    if (action === "ready") {
      setPlayerReady(game, body.playerId, body.ready);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "start") {
      startGame(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "restart") {
      recordFinishedGame(game);
      restartGame(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "kick") {
      kickPlayer(game, body.playerId, body.targetPlayerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "turn") {
      takeTurn(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "draw-opportunity") {
      drawOpportunity(game, body.playerId, body.type);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "buy") {
      buyOpportunity(game, body.playerId, body.mode);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "pass") {
      if (body.kind === "opportunity-choice") {
        passOpportunityChoice(game, body.playerId);
      } else {
        passOpportunity(game, body.playerId);
      }
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "repay-liability") {
      repayLiability(game, body.playerId, body.liabilityId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "complete-goal") {
      buyGrandGoal(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "buy-project") {
      buyProjectDeal(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "pass-project") {
      passProjectDeal(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "accept-market") {
      acceptMarketOffer(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "decline-market") {
      declineMarketOffer(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    if (action === "chat") {
      addChatMessage(game, body.playerId, body.text);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      saveRooms();
      broadcastRoom(game);
      return;
    }

    sendJson(res, 404, { error: "Действие не найдено." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function handleAuthApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = currentUser(req);
    sendJson(res, 200, { user: user ? serializeUser(user) : null });
    return;
  }

  if (req.method === "PATCH" && url.pathname === "/api/me") {
    const user = requireUser(req, res);
    if (!user) return;
    const body = await readJson(req);
    const name = normalizeName(body.name);
    if (!name) {
      sendJson(res, 400, { error: "Имя не может быть пустым." });
      return;
    }
    user.name = name;
    user.updatedAt = Date.now();
    for (const room of rooms.values()) {
      for (const player of room.players) {
        if (player.accountId === user.id) {
          player.name = name;
        }
      }
    }
    saveUsers();
    saveRooms();
    broadcastRoomsForUser(user.id);
    sendJson(res, 200, { user: serializeUser(user) });
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
    if ([...users.values()].some((user) => user.email === email)) {
      sendJson(res, 400, { error: "Пользователь с таким email уже есть." });
      return;
    }
    const user = createUser(name, email, password);
    users.set(user.id, user);
    const token = createSession(user.id);
    saveUsers();
    setSessionCookie(res, token);
    sendJson(res, 201, { user: serializeUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const user = [...users.values()].find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.password)) {
      sendJson(res, 401, { error: "Неверный email или пароль." });
      return;
    }
    const token = createSession(user.id);
    saveUsers();
    setSessionCookie(res, token);
    sendJson(res, 200, { user: serializeUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = sessionToken(req);
    if (token) {
      sessions.delete(token);
      saveUsers();
    }
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "Маршрут не найден." });
}

function subscribeToRoom(req, res, game) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write("retry: 1500\n\n");

  let streams = roomStreams.get(game.roomCode);
  if (!streams) {
    streams = new Set();
    roomStreams.set(game.roomCode, streams);
  }

  streams.add(res);
  writeEvent(res, "state", { game: serializeGame(game) });

  req.on("close", () => {
    streams.delete(res);
    if (streams.size === 0) {
      roomStreams.delete(game.roomCode);
    }
  });
}

function broadcastRoom(game) {
  const streams = roomStreams.get(game.roomCode);
  if (!streams) {
    return;
  }

  const payload = { game: serializeGame(game) };
  for (const stream of streams) {
    writeEvent(stream, "state", payload);
  }
}

function broadcastRoomsForUser(userId) {
  for (const game of rooms.values()) {
    if (game.players.some((player) => player.accountId === userId)) {
      broadcastRoom(game);
    }
  }
}

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
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

function loadRooms() {
  if (!fs.existsSync(ROOMS_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(ROOMS_FILE, "utf8");
    const savedRooms = JSON.parse(raw);
    if (!Array.isArray(savedRooms)) {
      return;
    }
    rooms.clear();
    for (const room of savedRooms) {
      if (room && typeof room.roomCode === "string" && Array.isArray(room.players)) {
        if (!room.hostId && room.players[0]) {
          room.hostId = room.players[0].id;
        }
        rooms.set(room.roomCode, room);
      }
    }
    console.log(`Loaded ${rooms.size} saved room(s).`);
  } catch (error) {
    console.error("Could not load saved rooms:", error.message);
  }
}

function saveRooms() {
  try {
    for (const game of rooms.values()) {
      recordFinishedGame(game);
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = JSON.stringify([...rooms.values()], null, 2);
    fs.writeFileSync(ROOMS_FILE, payload);
  } catch (error) {
    console.error("Could not save rooms:", error.message);
  }
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const saved = JSON.parse(raw);
    users.clear();
    sessions.clear();
    for (const user of saved.users || []) {
      users.set(user.id, normalizeUserRecord(user));
    }
    for (const session of saved.sessions || []) {
      if (session.token && users.has(session.userId)) {
        sessions.set(session.token, session);
      }
    }
    console.log(`Loaded ${users.size} user(s).`);
  } catch (error) {
    console.error("Could not load users:", error.message);
  }
}

function saveUsers() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = JSON.stringify({
      users: [...users.values()],
      sessions: [...sessions.values()]
    }, null, 2);
    fs.writeFileSync(USERS_FILE, payload);
  } catch (error) {
    console.error("Could not save users:", error.message);
  }
}

function createUser(name, email, password) {
  const now = Date.now();
  return {
    id: makeId(),
    name,
    email,
    password: hashPassword(password),
    stats: createEmptyStats(),
    history: [],
    createdAt: now,
    updatedAt: now
  };
}

function normalizeUserRecord(user) {
  return {
    ...user,
    stats: { ...createEmptyStats(), ...(user.stats || {}) },
    history: Array.isArray(user.history) ? user.history : []
  };
}

function createEmptyStats() {
  return {
    games: 0,
    wins: 0,
    bestNetWorth: 0,
    bestPassiveIncome: 0,
    bestProjectIncome: 0
  };
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    token,
    userId,
    createdAt: Date.now(),
    lastSeenAt: Date.now()
  });
  return token;
}

function currentUser(req) {
  const token = sessionToken(req);
  if (!token) {
    return null;
  }
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  session.lastSeenAt = Date.now();
  return users.get(session.userId) || null;
}

function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Нужно войти в аккаунт." });
    return null;
  }
  return user;
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    stats: user.stats || createEmptyStats(),
    history: (user.history || []).slice(-20).reverse(),
    rooms: savedRoomsForUser(user.id)
  };
}

function savedRoomsForUser(userId) {
  return [...rooms.values()]
    .filter((game) => game.players.some((player) => player.accountId === userId))
    .map((game) => ({
      roomCode: game.roomCode,
      status: game.status,
      host: game.players.find((player) => player.id === game.hostId)?.name || "Хост",
      players: game.players.map((player) => player.name),
      playerId: game.players.find((player) => player.accountId === userId)?.id || null,
      updatedAt: game.updatedAt,
      createdAt: game.createdAt
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function recordFinishedGame(game) {
  if (game.status !== "finished" || game.resultRecordedAt) {
    return;
  }

  const finishedAt = Date.now();
  const winner = game.players.find((player) => player.id === game.winnerId);
  for (const player of game.players) {
    if (!player.accountId) {
      continue;
    }
    const user = users.get(player.accountId);
    if (!user) {
      continue;
    }
    const netWorth = playerNetWorth(player);
    const won = player.id === game.winnerId;
    const record = {
      id: makeId(),
      roomCode: game.roomCode,
      finishedAt,
      won,
      winnerName: winner?.name || "Игрок",
      playerName: player.name,
      netWorth,
      cash: player.cash,
      passiveIncome: player.passiveIncome,
      projectIncome: player.projectIncome || 0,
      projectAssets: player.assets.filter((asset) => asset.type === "project-league").length,
      reputation: player.reputation || 0
    };
    user.history = [...(user.history || []), record].slice(-80);
    user.stats = user.stats || createEmptyStats();
    user.stats.games += 1;
    user.stats.wins += won ? 1 : 0;
    user.stats.bestNetWorth = Math.max(user.stats.bestNetWorth || 0, netWorth);
    user.stats.bestPassiveIncome = Math.max(user.stats.bestPassiveIncome || 0, player.passiveIncome || 0);
    user.stats.bestProjectIncome = Math.max(user.stats.bestProjectIncome || 0, player.projectIncome || 0);
    user.updatedAt = finishedAt;
  }
  game.resultRecordedAt = finishedAt;
  saveUsers();
}

function playerNetWorth(player) {
  const assetValue = player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0);
  const liabilities = player.liabilities.reduce((sum, liability) => sum + (liability.balance || 0), 0);
  return player.cash + assetValue - liabilities;
}

function canReadRoom(game, userId) {
  return game.players.some((player) => player.accountId === userId);
}

function canActAsPlayer(game, userId, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  return Boolean(player && player.accountId === userId);
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
  res.setHeader("Set-Cookie", `meshok_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "meshok_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
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
