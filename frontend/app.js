const cells = [
  ["payday", "Зарплата"],
  ["opportunity", "Возможность"],
  ["expense", "Расход"],
  ["market", "Рынок"],
  ["opportunity", "Возможность"],
  ["charity", "Благотворительность"],
  ["payday", "Зарплата"],
  ["expense", "Расход"],
  ["opportunity", "Возможность"],
  ["downsized", "Сокращение"],
  ["market", "Рынок"],
  ["expense", "Расход"],
  ["opportunity", "Возможность"],
  ["payday", "Зарплата"],
  ["expense", "Расход"],
  ["opportunity", "Возможность"],
  ["market", "Рынок"],
  ["payday", "Зарплата"]
];

const professions = [
  { id: "engineer", title: "Инженер", salary: 4200, expenses: 2600, cash: 1800 },
  { id: "teacher", title: "Учитель", salary: 2600, expenses: 1700, cash: 900 },
  { id: "doctor", title: "Врач", salary: 5200, expenses: 3600, cash: 2200 },
  { id: "driver", title: "Водитель", salary: 3100, expenses: 2100, cash: 1300 },
  { id: "designer", title: "Дизайнер", salary: 3600, expenses: 2400, cash: 1600 }
];

const state = {
  roomCode: localStorage.getItem("cashflow.roomCode"),
  playerId: localStorage.getItem("cashflow.playerId"),
  game: null,
  pollTimer: null,
  eventSource: null
};

const createForm = document.querySelector("#createForm");
const joinForm = document.querySelector("#joinForm");
const setupPanel = document.querySelector("#setupPanel");
const gamePanel = document.querySelector("#gamePanel");
const roomBadge = document.querySelector("#roomBadge");
const roomCode = document.querySelector("#roomCode");
const startButton = document.querySelector("#startButton");
const turnButton = document.querySelector("#turnButton");
const message = document.querySelector("#message");
const players = document.querySelector("#players");
const board = document.querySelector("#board");
const log = document.querySelector("#log");
const dealPanel = document.querySelector("#dealPanel");

renderProfessionOptions();

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const name = document.querySelector("#createName").value.trim();
    const professionId = document.querySelector("#createProfession").value;
    const data = await api("/api/rooms", { method: "POST", body: { name, professionId } });
    enterRoom(data.roomCode, data.playerId, data.game);
  });
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const code = document.querySelector("#joinCode").value.trim().toUpperCase();
    const name = document.querySelector("#joinName").value.trim();
    const professionId = document.querySelector("#joinProfession").value;
    const data = await api(`/api/rooms/${code}/join`, { method: "POST", body: { name, professionId } });
    enterRoom(code, data.playerId, data.game);
  });
});

startButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/start`, { method: "POST" });
    setGame(data.game);
  });
});

turnButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/turn`, {
      method: "POST",
      body: { playerId: state.playerId }
    });
    setGame(data.game);
  });
});

renderBoard();

if (state.roomCode && state.playerId) {
  refreshGame()
    .then(() => connectRealtime())
    .catch(() => clearSession());
}

function enterRoom(code, playerId, game) {
  state.roomCode = code;
  state.playerId = playerId;
  localStorage.setItem("cashflow.roomCode", code);
  localStorage.setItem("cashflow.playerId", playerId);
  setGame(game);
  connectRealtime();
}

function setGame(game) {
  state.game = game;
  setupPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  roomBadge.textContent = `Комната ${game.roomCode}`;
  roomCode.textContent = game.roomCode;
  renderPlayers();
  renderBoard();
  renderLog();
  renderDeal();
  updateControls();
}

function renderPlayers() {
  players.innerHTML = "";
  state.game.players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "player-card";
    if (player.id === state.game.currentPlayerId) card.classList.add("active");
    if (player.id === state.game.winnerId) card.classList.add("winner");
    card.innerHTML = `
      <div class="player-name">
        <span>${escapeHtml(player.name)}</span>
        <span>${player.lastRoll ? `D6 ${player.lastRoll}` : ""}</span>
      </div>
      <div class="profession">${escapeHtml(player.profession || "Профессия")}</div>
      <div class="stats">
        <span>Наличные<strong>${money(player.cash)}</strong></span>
        <span>Доходы<strong>${money(player.totalIncome ?? player.salary + player.passiveIncome)}</strong></span>
        <span>Расходы<strong>${money(player.expenses)}</strong></span>
        <span>Поток<strong>${money(player.monthlyCashflow ?? player.salary + player.passiveIncome - player.expenses)}</strong></span>
        <span>Пассивный<strong>${money(player.passiveIncome)}</strong></span>
        <span>Платежи<strong>${money(player.totalLiabilityPayment ?? 0)}</strong></span>
        <span>Долги<strong>${money(player.liabilityBalance ?? 0)}</strong></span>
        <span>Активы<strong>${player.assets.length}</strong></span>
      </div>
    `;
    players.append(card);
  });
}

function renderProfessionOptions() {
  const options = professions
    .map((profession) => {
      const cashflow = profession.salary - profession.expenses;
      return `<option value="${profession.id}">${profession.title}: поток ${money(cashflow)}, кэш ${money(profession.cash)}</option>`;
    })
    .join("");

  document.querySelector("#createProfession").innerHTML = options;
  document.querySelector("#joinProfession").innerHTML = options;
}

function renderBoard() {
  board.innerHTML = "";
  cells.forEach(([type, label], index) => {
    const cell = document.createElement("div");
    cell.className = `cell ${type}`;
    const tokens = state.game?.players.filter((player) => player.position === index) || [];
    cell.innerHTML = `
      <div class="cell-number">${index + 1}</div>
      <div class="cell-label">${label}</div>
      <div class="tokens">
        ${tokens.map((player) => `<span class="token" title="${escapeHtml(player.name)}">${escapeHtml(initials(player.name))}</span>`).join("")}
      </div>
    `;
    board.append(cell);
  });
}

function renderLog() {
  log.innerHTML = "";
  state.game.log.slice(0, 40).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    log.append(li);
  });
}

function renderDeal() {
  const me = myPlayer();
  if (!me?.pendingOpportunity) {
    dealPanel.classList.add("hidden");
    dealPanel.innerHTML = "";
    return;
  }

  const deal = me.pendingOpportunity;
  dealPanel.classList.remove("hidden");
  dealPanel.innerHTML = `
    <div>
      <p class="eyebrow">Сделка</p>
      <h2>${escapeHtml(deal.title)}</h2>
    </div>
    <p>${escapeHtml(deal.text)}</p>
    <p>Цена: <strong>${money(deal.cost)}</strong></p>
    <p>Пассивный доход: <strong>${money(deal.passiveIncome)}</strong></p>
    <div class="deal-actions">
      <button id="buyButton" ${me.cash < deal.cost ? "disabled" : ""}>Купить</button>
      <button id="passButton" class="secondary">Пропустить</button>
    </div>
  `;

  document.querySelector("#buyButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/buy`, {
        method: "POST",
        body: { playerId: state.playerId }
      });
      setGame(data.game);
    });
  });

  document.querySelector("#passButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/pass`, {
        method: "POST",
        body: { playerId: state.playerId }
      });
      setGame(data.game);
    });
  });
}

function updateControls() {
  const game = state.game;
  const me = myPlayer();
  const isMyTurn = game.currentPlayerId === state.playerId;
  const hasPendingDeal = Boolean(me?.pendingOpportunity);

  startButton.disabled = game.status !== "lobby";
  turnButton.disabled = game.status !== "playing" || !isMyTurn || hasPendingDeal;

  if (game.status === "lobby") {
    message.textContent = "Поделись кодом комнаты и начинай игру, когда все готовы.";
  } else if (game.status === "finished") {
    const winner = game.players.find((player) => player.id === game.winnerId);
    message.textContent = `${winner?.name || "Игрок"} победил: пассивный доход покрыл расходы.`;
  } else if (isMyTurn) {
    message.textContent = hasPendingDeal ? "Реши, покупать ли сделку, затем ход перейдёт дальше." : "Твой ход.";
  } else {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    message.textContent = `Ход игрока ${current?.name || "..."}.`;
  }
}

async function refreshGame() {
  const data = await api(`/api/rooms/${state.roomCode}`);
  setGame(data.game);
}

function connectRealtime() {
  stopPolling();
  if (state.eventSource) {
    state.eventSource.close();
  }

  if (typeof EventSource !== "function") {
    startPolling();
    return;
  }

  state.eventSource = new EventSource(`/api/rooms/${state.roomCode}/events`);
  state.eventSource.addEventListener("state", (event) => {
    const data = JSON.parse(event.data);
    setGame(data.game);
  });
  state.eventSource.addEventListener("open", () => {
    stopPolling();
  });
  state.eventSource.addEventListener("error", () => {
    startPolling();
    if (state.game) {
      message.textContent = "Связь восстанавливается. Включён резервный режим обновления.";
    }
  });
}

function startPolling() {
  clearInterval(state.pollTimer);
  state.pollTimer = setInterval(() => {
    refreshGame().catch(() => {});
  }, 1500);
}

function stopPolling() {
  clearInterval(state.pollTimer);
  state.pollTimer = null;
}

async function api(url, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" }
  };
  if (options.body) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Ошибка запроса.");
  }
  return data;
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    showError(error.message || "Не удалось выполнить действие.");
  }
}

function myPlayer() {
  return state.game?.players.find((player) => player.id === state.playerId);
}

function clearSession() {
  localStorage.removeItem("cashflow.roomCode");
  localStorage.removeItem("cashflow.playerId");
  if (state.eventSource) {
    state.eventSource.close();
  }
  stopPolling();
}

function showError(text) {
  if (state.game) {
    message.textContent = text;
    message.classList.add("error");
    window.setTimeout(() => message.classList.remove("error"), 2400);
    return;
  }

  roomBadge.textContent = text;
}

function money(value) {
  return `$${Number(value).toLocaleString("en-US")}`;
}

function initials(name) {
  return String(name || "?").trim().slice(0, 2).toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
