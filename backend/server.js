const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createGame,
  addPlayer,
  startGame,
  takeTurn,
  buyOpportunity,
  passOpportunity,
  serializeGame,
  makeRoomCode
} = require("../shared/gameRules");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const rooms = new Map();

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

server.listen(PORT, () => {
  console.log(`Cashflow MVP is running at http://localhost:${PORT}`);
});

async function handleApi(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(req);
    const code = uniqueRoomCode();
    const game = createGame(code, body.name);
    rooms.set(code, game);
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
    sendJson(res, 200, { game: serializeGame(game) });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Метод не поддерживается." });
    return;
  }

  const body = await readJson(req);

  try {
    if (action === "join") {
      const player = addPlayer(game, body.name);
      sendJson(res, 200, { playerId: player.id, game: serializeGame(game) });
      return;
    }

    if (action === "start") {
      startGame(game);
      sendJson(res, 200, { game: serializeGame(game) });
      return;
    }

    if (action === "turn") {
      takeTurn(game, body.playerId);
      sendJson(res, 200, { game: serializeGame(game) });
      return;
    }

    if (action === "buy") {
      buyOpportunity(game, body.playerId);
      sendJson(res, 200, { game: serializeGame(game) });
      return;
    }

    if (action === "pass") {
      passOpportunity(game, body.playerId);
      sendJson(res, 200, { game: serializeGame(game) });
      return;
    }

    sendJson(res, 404, { error: "Действие не найдено." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
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

    res.writeHead(200, { "Content-Type": contentType });
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
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
