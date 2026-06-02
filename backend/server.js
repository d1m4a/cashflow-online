const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  createGame,
  addPlayer,
  startGame,
  takeTurn,
  drawOpportunity,
  buyOpportunity,
  passOpportunity,
  passOpportunityChoice,
  repayLiability,
  buyDream,
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
const rooms = new Map();
const roomStreams = new Map();

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
  return server.listen(port, () => {
    console.log(`Cashflow MVP is running at http://localhost:${port}`);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/rules") {
    sendJson(res, 200, serializeRules());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(req);
    const code = uniqueRoomCode();
    const game = createGame(code, body.name, body.professionId);
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

  if (req.method === "GET" && action === "events") {
    subscribeToRoom(req, res, game);
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
      const player = addPlayer(game, body.name, body.professionId);
      const payload = { playerId: player.id, game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "start") {
      startGame(game);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "turn") {
      takeTurn(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "draw-opportunity") {
      drawOpportunity(game, body.playerId, body.type);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "buy") {
      buyOpportunity(game, body.playerId, body.mode);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
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
      broadcastRoom(game);
      return;
    }

    if (action === "repay-liability") {
      repayLiability(game, body.playerId, body.liabilityId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "buy-dream") {
      buyDream(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "accept-market") {
      acceptMarketOffer(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "decline-market") {
      declineMarketOffer(game, body.playerId);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    if (action === "chat") {
      addChatMessage(game, body.playerId, body.text);
      const payload = { game: serializeGame(game) };
      sendJson(res, 200, payload);
      broadcastRoom(game);
      return;
    }

    sendJson(res, 404, { error: "Действие не найдено." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
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
