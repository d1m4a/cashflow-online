let cells = [];
let projectCells = [];
let professions = [];
let ruleSummary = {};

const state = {
  roomCode: localStorage.getItem("meshok.roomCode"),
  playerId: localStorage.getItem("meshok.playerId"),
  user: null,
  game: null,
  pollTimer: null,
  eventSource: null
};

const authPanel = document.querySelector("#authPanel");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const profilePanel = document.querySelector("#profilePanel");
const profileForm = document.querySelector("#profileForm");
const profileTitle = document.querySelector("#profileTitle");
const profileEmail = document.querySelector("#profileEmail");
const profileName = document.querySelector("#profileName");
const profileStats = document.querySelector("#profileStats");
const profileRooms = document.querySelector("#profileRooms");
const profileHistory = document.querySelector("#profileHistory");
const homeNav = document.querySelector("#homeNav");
const roomsNav = document.querySelector("#roomsNav");
const profileNav = document.querySelector("#profileNav");
const logoutButton = document.querySelector("#logoutButton");
const createForm = document.querySelector("#createForm");
const joinForm = document.querySelector("#joinForm");
const setupPanel = document.querySelector("#setupPanel");
const gamePanel = document.querySelector("#gamePanel");
const roomBadge = document.querySelector("#roomBadge");
const roomCode = document.querySelector("#roomCode");
const inviteLink = document.querySelector("#inviteLink");
const copyInviteButton = document.querySelector("#copyInviteButton");
const readyButton = document.querySelector("#readyButton");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const turnButton = document.querySelector("#turnButton");
const message = document.querySelector("#message");
const players = document.querySelector("#players");
const board = document.querySelector("#board");
const log = document.querySelector("#log");
const resultPanel = document.querySelector("#resultPanel");
const dealPanel = document.querySelector("#dealPanel");
const marketPanel = document.querySelector("#marketPanel");
const reportPanel = document.querySelector("#reportPanel");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");

init();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: {
        email: document.querySelector("#loginEmail").value,
        password: document.querySelector("#loginPassword").value
      }
    });
    await setUser(data.user);
    showLobby();
  });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: {
        name: document.querySelector("#registerName").value,
        email: document.querySelector("#registerEmail").value,
        password: document.querySelector("#registerPassword").value
      }
    });
    await setUser(data.user);
    showLobby();
  });
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const data = await api("/api/me", {
      method: "PATCH",
      body: { name: profileName.value }
    });
    await setUser(data.user);
    message.textContent = "Профиль сохранён.";
  });
});

logoutButton.addEventListener("click", async () => {
  runAction(async () => {
    await api("/api/auth/logout", { method: "POST" });
    clearSession();
    state.user = null;
    state.game = null;
    state.roomCode = null;
    state.playerId = null;
    showAuth();
  });
});

homeNav.addEventListener("click", (event) => {
  event.preventDefault();
  showLobby();
});

roomsNav.addEventListener("click", (event) => {
  event.preventDefault();
  showProfile();
});

profileNav.addEventListener("click", (event) => {
  event.preventDefault();
  showProfile();
});

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const name = document.querySelector("#createName").value.trim();
    const professionId = document.querySelector("#createProfession").value;
    const data = await api("/api/rooms", { method: "POST", body: { name, professionId } });
    await enterRoom(data.roomCode, data.playerId, data.game);
  });
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const code = document.querySelector("#joinCode").value.trim().toUpperCase();
    const name = document.querySelector("#joinName").value.trim();
    const professionId = document.querySelector("#joinProfession").value;
    const data = await api(`/api/rooms/${code}/join`, { method: "POST", body: { name, professionId } });
    await enterRoom(code, data.playerId, data.game);
  });
});

startButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/start`, {
      method: "POST",
      body: { playerId: state.playerId }
    });
    await setGame(data.game);
  });
});

readyButton.addEventListener("click", async () => {
  runAction(async () => {
    const me = myPlayer();
    const data = await api(`/api/rooms/${state.roomCode}/ready`, {
      method: "POST",
      body: { playerId: state.playerId, ready: !me?.ready }
    });
    await setGame(data.game);
  });
});

restartButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/restart`, {
      method: "POST",
      body: { playerId: state.playerId }
    });
    await setGame(data.game);
  });
});

copyInviteButton.addEventListener("click", async () => {
  runAction(async () => {
    const link = inviteUrl();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    }
    inviteLink.select();
    message.textContent = "Ссылка-приглашение скопирована.";
  });
});

turnButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/turn`, {
      method: "POST",
      body: { playerId: state.playerId }
    });
    await setGame(data.game);
  });
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const text = chatInput.value.trim();
    const data = await api(`/api/rooms/${state.roomCode}/chat`, {
      method: "POST",
      body: { playerId: state.playerId, text }
    });
    chatInput.value = "";
    await setGame(data.game);
  });
});

async function init() {
  try {
    const invitedRoom = new URLSearchParams(window.location.search).get("room");
    if (invitedRoom && !state.roomCode) {
      document.querySelector("#joinCode").value = invitedRoom.trim().toUpperCase();
    }
    await loadRules();
    renderProfessionOptions();
    renderBoard();
    const session = await api("/api/me");
    await setUser(session.user);

    if (!state.user) {
      showAuth();
      return;
    }

    if (state.roomCode && state.playerId) {
      await refreshGame();
      connectRealtime();
    } else {
      showLobby();
    }
  } catch (error) {
    clearSession();
    showAuth();
    showError(error.message || "Не удалось загрузить игру.");
  }
}

async function loadRules() {
  const rules = await api("/api/rules");
  ruleSummary = rules;
  cells = rules.cells.map((cell) => [cell.type, cell.label]);
  projectCells = rules.projectCells.map((cell) => [cell.type, cell.label]);
  professions = rules.professions;
}

async function ensureRulesLoaded() {
  if (cells.length > 0 && projectCells.length > 0 && professions.length > 0) {
    return;
  }
  await loadRules();
}

async function enterRoom(code, playerId, game) {
  state.roomCode = code;
  state.playerId = playerId;
  localStorage.setItem("meshok.roomCode", code);
  localStorage.setItem("meshok.playerId", playerId);
  await setGame(game);
  connectRealtime();
}

async function setUser(user) {
  state.user = user;
  logoutButton.classList.toggle("hidden", !user);
  if (!user) {
    return;
  }
  profileTitle.textContent = user.name;
  profileEmail.textContent = user.email;
  profileName.value = user.name;
  document.querySelector("#createName").value = user.name;
  document.querySelector("#joinName").value = user.name;
  renderProfile();
}

async function setGame(game) {
  await ensureRulesLoaded();
  state.game = game;
  if (state.playerId && !myPlayer()) {
    clearSession();
    state.roomCode = null;
    state.playerId = null;
    state.game = null;
    setupPanel.classList.remove("hidden");
    gamePanel.classList.add("hidden");
    roomBadge.textContent = "Вы удалены из комнаты";
    return;
  }
  setupPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  roomBadge.textContent = `Комната ${game.roomCode}`;
  roomCode.textContent = game.roomCode;
  inviteLink.value = inviteUrl();
  renderPlayers();
  renderBoard();
  renderLog();
  renderResult();
  renderDeal();
  renderMarketOffer();
  renderReport();
  renderChat();
  updateControls();
}

function showAuth() {
  authPanel.classList.remove("hidden");
  setupPanel.classList.add("hidden");
  profilePanel.classList.add("hidden");
  gamePanel.classList.add("hidden");
  roomBadge.textContent = "Войдите";
  setActiveNav(null);
}

function showLobby() {
  if (!state.user) {
    showAuth();
    return;
  }
  authPanel.classList.add("hidden");
  profilePanel.classList.add("hidden");
  if (state.game) {
    setupPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
  } else {
    setupPanel.classList.remove("hidden");
    gamePanel.classList.add("hidden");
    roomBadge.textContent = `Профиль: ${state.user.name}`;
  }
  setActiveNav(homeNav);
}

function showProfile() {
  if (!state.user) {
    showAuth();
    return;
  }
  authPanel.classList.add("hidden");
  setupPanel.classList.add("hidden");
  gamePanel.classList.add("hidden");
  profilePanel.classList.remove("hidden");
  roomBadge.textContent = `Профиль: ${state.user.name}`;
  renderProfile();
  setActiveNav(profileNav);
}

function setActiveNav(active) {
  [homeNav, roomsNav, profileNav].forEach((item) => item.classList.toggle("active", item === active));
}

function renderProfile() {
  if (!state.user) {
    return;
  }
  const stats = state.user.stats || {};
  profileStats.innerHTML = `
    <span>Игр<strong>${stats.games || 0}</strong></span>
    <span>Побед<strong>${stats.wins || 0}</strong></span>
    <span>Лучший капитал<strong>${money(stats.bestNetWorth || 0)}</strong></span>
    <span>Лучший инвестдоход<strong>${money(stats.bestPassiveIncome || 0)}</strong></span>
    <span>Лучший доход проектов<strong>${money(stats.bestProjectIncome || 0)}</strong></span>
  `;
  profileRooms.innerHTML = state.user.rooms?.length
    ? state.user.rooms.map((room) => `
      <li>
        <span><strong>${escapeHtml(room.roomCode)}</strong> ${escapeHtml(room.statusText || room.status)} · ${escapeHtml(room.players.join(", "))}</span>
        <button class="mini-button" data-room="${escapeHtml(room.roomCode)}" data-player="${escapeHtml(room.playerId || "")}">Открыть</button>
      </li>
    `).join("")
    : "<li>Сохранённых комнат пока нет</li>";
  profileHistory.innerHTML = state.user.history?.length
    ? state.user.history.map((item) => `
      <li>
        <span><strong>${item.won ? "Победа" : "Партия"}</strong> ${escapeHtml(item.roomCode)} · ${formatDate(item.finishedAt)}</span>
        <small>${money(item.netWorth)} капитал · ${money(item.passiveIncome)} инвестдоход · победитель ${escapeHtml(item.winnerName)}</small>
      </li>
    `).join("")
    : "<li>История появится после завершения партии</li>";

  profileRooms.querySelectorAll("[data-room]").forEach((button) => {
    button.addEventListener("click", async () => {
      runAction(async () => {
        state.roomCode = button.dataset.room;
        state.playerId = button.dataset.player;
        localStorage.setItem("meshok.roomCode", state.roomCode);
        localStorage.setItem("meshok.playerId", state.playerId);
        await refreshGame();
        connectRealtime();
        showLobby();
      });
    });
  });
}

function renderPlayers() {
  players.innerHTML = "";
  const me = myPlayer();
  const isHost = me?.id === state.game.hostId;
  state.game.players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "player-card";
    if (player.id === state.game.currentPlayerId) card.classList.add("active");
    if (player.id === state.game.winnerId) card.classList.add("winner");
    const hostMark = player.id === state.game.hostId ? `<span class="player-mark host-mark">Хост</span>` : "";
    const readyMark = state.game.status === "lobby"
      ? `<span class="player-mark ${player.ready || player.id === state.game.hostId ? "ready-mark" : ""}">${player.id === state.game.hostId ? "управляет" : player.ready ? "готов" : "не готов"}</span>`
      : "";
    const kickButton = isHost && player.id !== state.game.hostId && state.game.status === "lobby"
      ? `<button class="mini-button secondary" data-kick="${escapeHtml(player.id)}">Кик</button>`
      : "";
    card.innerHTML = `
      <div class="player-name">
        <span>${escapeHtml(player.name)}</span>
        <span>${player.lastRoll ? `D6 ${player.lastRoll}` : ""}</span>
      </div>
      <div class="player-flags">${hostMark}${readyMark}${kickButton}</div>
      <div class="profession">${escapeHtml(player.profession || "Профессия")} · ${player.track === "project-league" ? "Лига проектов" : "Денежный двор"}</div>
      ${player.track === "project-league" ? `<div class="goal-line">Цель: ${escapeHtml(player.grandGoal?.title || "проект")}</div>` : ""}
      <div class="stats">
        <span>Наличные<strong>${money(player.cash)}</strong></span>
        <span>Доходы<strong>${money(player.totalIncome ?? player.salary + player.passiveIncome)}</strong></span>
        <span>Расходы<strong>${money(player.expenses)}</strong></span>
        <span>Остаток<strong>${money(player.monthlySurplus ?? player.salary + player.passiveIncome - player.expenses)}</strong></span>
        <span>Инвестдоход<strong>${money(player.passiveIncome)}</strong></span>
        <span>Репутация<strong>${player.reputation ?? 0}</strong></span>
        <span>Платежи<strong>${money(player.totalLiabilityPayment ?? 0)}</strong></span>
        <span>Долги<strong>${money(player.liabilityBalance ?? 0)}</strong></span>
        <span>Активы<strong>${player.assets.length}</strong></span>
        ${player.track === "project-league" ? `<span>Проекты<strong>${money(player.projectIncome ?? 0)}</strong></span>` : ""}
      </div>
    `;
    players.append(card);
  });

  players.querySelectorAll("[data-kick]").forEach((button) => {
    button.addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/kick`, {
          method: "POST",
          body: { playerId: state.playerId, targetPlayerId: button.dataset.kick }
        });
        await setGame(data.game);
      });
    });
  });
}

function renderProfessionOptions() {
  const options = professions
    .map((profession) => {
      const surplus = profession.salary - profession.expenses;
      return `<option value="${profession.id}">${profession.title}: остаток ${money(surplus)}, кэш ${money(profession.cash)}</option>`;
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
    const tokens = state.game?.players.filter((player) => (player.track || "money-yard") === "money-yard" && player.position === index) || [];
    cell.innerHTML = `
      <div class="cell-number">${index + 1}</div>
      <div class="cell-label">${label}</div>
      <div class="tokens">
        ${tokens.map((player) => `<span class="token" title="${escapeHtml(player.name)}">${escapeHtml(initials(player.name))}</span>`).join("")}
      </div>
    `;
    board.append(cell);
  });

  projectCells.forEach(([type, label], index) => {
    const cell = document.createElement("div");
    cell.className = `cell project-cell ${type}`;
    const tokens = state.game?.players.filter((player) => player.track === "project-league" && player.projectPosition === index) || [];
    cell.innerHTML = `
      <div class="cell-number">F${index + 1}</div>
      <div class="cell-label">${label}</div>
      <div class="tokens">
        ${tokens.map((player) => `<span class="token project-token" title="${escapeHtml(player.name)}">${escapeHtml(initials(player.name))}</span>`).join("")}
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

function renderResult() {
  if (state.game.status !== "finished") {
    resultPanel.classList.add("hidden");
    resultPanel.innerHTML = "";
    return;
  }

  const winner = state.game.players.find((player) => player.id === state.game.winnerId);
  const rows = state.game.players
    .map((player) => {
      const netWorth = player.cash + player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0) - (player.liabilityBalance || 0);
      return `
        <li class="${player.id === state.game.winnerId ? "winner-row" : ""}">
          <span>${escapeHtml(player.name)}</span>
          <strong>${money(netWorth)}</strong>
          <small>${money(player.passiveIncome)} инвестдоход · ${player.projectAssetCount ?? 0} проектов · репутация ${player.reputation ?? 0}</small>
        </li>
      `;
    })
    .join("");

  resultPanel.classList.remove("hidden");
  resultPanel.innerHTML = `
    <p class="eyebrow">Итог партии</p>
    <h2>${escapeHtml(winner?.name || "Игрок")} победил</h2>
    <p>${escapeHtml(victoryReason(winner))}</p>
    <ul class="result-list">${rows}</ul>
  `;
}

function renderDeal() {
  const me = myPlayer();
  if (me?.pendingProjectDeal) {
    const deal = me.pendingProjectDeal;
    const upkeep = deal.upkeep || 0;
    const netIncome = Math.max(0, deal.passiveIncome - upkeep);
    dealPanel.classList.remove("hidden");
    dealPanel.innerHTML = `
      <div>
        <p class="eyebrow">Проект</p>
        <h2>${escapeHtml(deal.title)}</h2>
      </div>
      <p>${escapeHtml(deal.text)}</p>
      <p>Вход: <strong>${money(deal.cost)}</strong></p>
      <p>Оценка: <strong>${money(deal.marketValue ?? deal.cost)}</strong></p>
      <p>Доход проектов: <strong>+${money(deal.passiveIncome)}</strong></p>
      <p>Обслуживание: <strong>${money(upkeep)}</strong></p>
      <p>Чистый поток: <strong>+${money(netIncome)}</strong></p>
      <div class="deal-actions">
        <button id="buyProjectButton" ${me.cash < deal.cost ? "disabled" : ""}>Вложиться</button>
        <button id="passProjectButton" class="secondary">Пропустить</button>
      </div>
    `;

    document.querySelector("#buyProjectButton").addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/buy-project`, {
          method: "POST",
          body: { playerId: state.playerId }
        });
        await setGame(data.game);
      });
    });

    document.querySelector("#passProjectButton").addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/pass-project`, {
          method: "POST",
          body: { playerId: state.playerId }
        });
        await setGame(data.game);
      });
    });
    return;
  }

  if (me?.pendingOpportunityChoice) {
    dealPanel.classList.remove("hidden");
    dealPanel.innerHTML = `
      <div>
        <p class="eyebrow">Возможность</p>
        <h2>Выбор сделки</h2>
      </div>
      <p>Выбери малую сделку с меньшим входом или крупную сделку с большим потенциалом и риском.</p>
      <div class="deal-actions">
        <button id="smallDealButton">Малая</button>
        <button id="largeDealButton">Крупная</button>
        <button id="skipDealChoiceButton" class="secondary">Пропустить</button>
      </div>
    `;

    document.querySelector("#smallDealButton").addEventListener("click", () => chooseDealType("small"));
    document.querySelector("#largeDealButton").addEventListener("click", () => chooseDealType("large"));
    document.querySelector("#skipDealChoiceButton").addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/pass`, {
          method: "POST",
          body: { playerId: state.playerId, kind: "opportunity-choice" }
        });
        await setGame(data.game);
      });
    });
    return;
  }

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
    <p>Тип: <strong>${deal.type === "large" ? "Крупная" : "Малая"} сделка</strong></p>
    <p>Цена: <strong>${money(deal.cost)}</strong></p>
    <p>Взнос: <strong>${money(deal.downPayment ?? deal.cost)}</strong></p>
    <p>Кредит: <strong>${money(deal.loan ?? 0)}</strong>, платёж <strong>${money(deal.payment ?? 0)}</strong></p>
    <p>Инвестдоход: <strong>${money(deal.passiveIncome)}</strong></p>
    <div class="deal-actions">
      <button id="buyCashButton" ${me.cash < deal.cost ? "disabled" : ""}>За наличные</button>
      <button id="buyFinanceButton" ${(deal.loan || 0) <= 0 || me.cash < (deal.downPayment ?? deal.cost) ? "disabled" : ""}>С кредитом</button>
      <button id="passButton" class="secondary">Пропустить</button>
    </div>
  `;

  document.querySelector("#buyCashButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/buy`, {
        method: "POST",
        body: { playerId: state.playerId, mode: "cash" }
      });
      await setGame(data.game);
    });
  });

  document.querySelector("#buyFinanceButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/buy`, {
        method: "POST",
        body: { playerId: state.playerId, mode: "finance" }
      });
      await setGame(data.game);
    });
  });

  document.querySelector("#passButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/pass`, {
        method: "POST",
        body: { playerId: state.playerId }
      });
      await setGame(data.game);
    });
  });
}

function chooseDealType(type) {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/draw-opportunity`, {
      method: "POST",
      body: { playerId: state.playerId, type }
    });
    await setGame(data.game);
  });
}

function renderMarketOffer() {
  const me = myPlayer();
  if (!me?.pendingMarketOffer) {
    marketPanel.classList.add("hidden");
    marketPanel.innerHTML = "";
    return;
  }

  const offer = me.pendingMarketOffer;
  marketPanel.classList.remove("hidden");
  marketPanel.innerHTML = `
    <div>
      <p class="eyebrow">Рынок</p>
      <h2>${escapeHtml(offer.title)}</h2>
    </div>
    <p>${escapeHtml(offer.text)}</p>
    <p>Актив: <strong>${escapeHtml(offer.assetTitle)}</strong></p>
    <p>Цена продажи: <strong>${money(offer.price)}</strong></p>
    <div class="deal-actions">
      <button id="acceptMarketButton">Продать</button>
      <button id="declineMarketButton" class="secondary">Оставить</button>
    </div>
  `;

  document.querySelector("#acceptMarketButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/accept-market`, {
        method: "POST",
        body: { playerId: state.playerId }
      });
      await setGame(data.game);
    });
  });

  document.querySelector("#declineMarketButton").addEventListener("click", async () => {
    runAction(async () => {
      const data = await api(`/api/rooms/${state.roomCode}/decline-market`, {
        method: "POST",
        body: { playerId: state.playerId }
      });
      await setGame(data.game);
    });
  });
}

function renderReport() {
  const me = myPlayer();
  if (!me) {
    reportPanel.innerHTML = "";
    return;
  }

  const assets = me.assets.length
    ? me.assets.map((asset) => `<li>${escapeHtml(asset.title)} <strong>${money(asset.passiveIncome)}</strong></li>`).join("")
    : "<li>Активов пока нет</li>";
  const liabilities = me.liabilities.length
    ? me.liabilities.map((liability) => `
      <li>
        <span>${escapeHtml(liability.title)} <strong>${money(liability.balance)}</strong></span>
        <button class="mini-button" data-liability="${escapeHtml(liability.id || "")}" ${me.cash < liability.balance || !liability.id ? "disabled" : ""}>Закрыть</button>
      </li>
    `).join("")
    : "<li>Долгов нет</li>";
  const goal = me.grandGoal;
  const readiness = me.projectReadiness;
  const projectIncomeGoal = ruleSummary.projectIncomeGoal ?? 0;
  const projectPortfolioGoal = ruleSummary.projectPortfolioGoal ?? 0;
  const projectIncomeProgress = projectIncomeGoal ? `${money(me.projectIncome ?? 0)} / ${money(projectIncomeGoal)}` : money(me.projectIncome ?? 0);
  const projectCountProgress = projectPortfolioGoal ? `${me.projectAssetCount ?? 0} / ${projectPortfolioGoal}` : `${me.projectAssetCount ?? 0}`;
  const goalBlock = goal
    ? `
      <div class="goal-box">
        <p class="eyebrow">Лига проектов</p>
        <h3>${escapeHtml(goal.title)}</h3>
        <p>${escapeHtml(goal.text || "")}</p>
        <p>Стоимость: <strong>${money(goal.cost)}</strong></p>
        <p>Портфельная победа: <strong>${projectCountProgress}</strong> проектов и <strong>${projectIncomeProgress}</strong> дохода.</p>
        <button id="completeGoalButton" class="mini-button" ${me.track !== "project-league" || me.cash < goal.cost || state.game.status !== "playing" ? "disabled" : ""}>Закрыть цель</button>
      </div>
    `
    : "";

  reportPanel.innerHTML = `
    <p class="eyebrow">8. Финансы</p>
    <h2>Отчёт игрока</h2>
    <div class="report-grid">
      <span>Зарплата<strong>${money(me.salary)}</strong></span>
      <span>Инвестдоход<strong>${money(me.passiveIncome)}</strong></span>
      <span>Расходы<strong>${money(me.expenses)}</strong></span>
      <span>Остаток<strong>${money(me.monthlySurplus)}</strong></span>
      <span>Круг<strong>${me.track === "project-league" ? "Лига проектов" : "Денежный двор"}</strong></span>
      <span>Репутация<strong>${me.reputation ?? 0}${readiness ? ` / ${readiness.reputationRequired}` : ""}</strong></span>
      <span>Резерв<strong>${readiness ? `${money(readiness.reserve)} / ${money(readiness.reserveRequired)}` : money(me.cash)}</strong></span>
      <span>Доход проектов<strong>${projectIncomeProgress}</strong></span>
      <span>Чистый поток проектов<strong>${money(me.projectNetIncome ?? 0)}</strong></span>
      <span>Обслуживание проектов<strong>${money(me.projectMaintenanceCost ?? 0)}</strong></span>
      <span>Проектов<strong>${projectCountProgress}</strong></span>
    </div>
    ${goalBlock}
    <div class="report-columns">
      <div>
        <h3>Активы</h3>
        <ul>${assets}</ul>
      </div>
      <div>
        <h3>Обязательства</h3>
        <ul>${liabilities}</ul>
      </div>
    </div>
  `;

  reportPanel.querySelectorAll("[data-liability]").forEach((button) => {
    button.addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/repay-liability`, {
          method: "POST",
          body: { playerId: state.playerId, liabilityId: button.dataset.liability }
        });
        await setGame(data.game);
      });
    });
  });

  const completeGoalButton = document.querySelector("#completeGoalButton");
  if (completeGoalButton) {
    completeGoalButton.addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/complete-goal`, {
          method: "POST",
          body: { playerId: state.playerId }
        });
        await setGame(data.game);
      });
    });
  }
}

function renderChat() {
  chatLog.innerHTML = "";
  (state.game.chat || []).slice(-30).forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(item.playerName)}</strong><span>${escapeHtml(item.text)}</span>`;
    chatLog.append(li);
  });
}

function updateControls() {
  const game = state.game;
  const me = myPlayer();
  const isHost = me?.id === game.hostId;
  const isMyTurn = game.currentPlayerId === state.playerId;
  const hasPendingDeal = Boolean(me?.pendingOpportunity || me?.pendingOpportunityChoice || me?.pendingMarketOffer || me?.pendingProjectDeal);
  const notReadyPlayers = game.players.filter((player) => player.id !== game.hostId && !player.ready);

  readyButton.classList.toggle("hidden", game.status !== "lobby" || isHost);
  readyButton.textContent = me?.ready ? "Не готов" : "Готов";
  readyButton.disabled = game.status !== "lobby" || isHost;
  startButton.classList.toggle("hidden", !isHost || game.status !== "lobby");
  startButton.disabled = game.status !== "lobby" || !isHost || notReadyPlayers.length > 0;
  restartButton.classList.toggle("hidden", !isHost || game.status !== "finished");
  restartButton.disabled = game.status !== "finished" || !isHost;
  turnButton.disabled = game.status !== "playing" || !isMyTurn || hasPendingDeal;
  turnButton.classList.toggle("hidden", game.status === "finished");

  if (game.status === "lobby") {
    message.textContent = isHost
      ? notReadyPlayers.length > 0 ? `Ждём готовность: ${notReadyPlayers.map((player) => player.name).join(", ")}.` : "Все готовы. Можно начинать игру."
      : me?.ready ? "Ты готов. Ждём старт от хоста." : "Отметь готовность, когда можно начинать.";
  } else if (game.status === "finished") {
    const winner = game.players.find((player) => player.id === game.winnerId);
    message.textContent = isHost ? `${winner?.name || "Игрок"} победил. Можно начать новую игру в этой комнате.` : `${winner?.name || "Игрок"} победил. Ждём рестарт от хоста.`;
  } else if (isMyTurn) {
    message.textContent = hasPendingDeal ? "Заверши текущее решение, затем ход перейдёт дальше." : me?.track === "project-league" ? "Твой ход в Лиге проектов." : "Твой ход.";
  } else {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    message.textContent = `Ход игрока ${current?.name || "..."}.`;
  }
}

async function refreshGame() {
  const data = await api(`/api/rooms/${state.roomCode}`);
  await setGame(data.game);
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
    setGame(data.game).catch((error) => showError(error.message || "Не удалось обновить игру."));
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

function inviteUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.roomCode || "");
  return url.toString();
}

function victoryReason(winner) {
  if (!winner) {
    return "Партия завершена.";
  }
  if ((winner.projectIncome ?? 0) >= (ruleSummary.projectIncomeGoal ?? Infinity) && (winner.projectAssetCount ?? 0) >= (ruleSummary.projectPortfolioGoal ?? Infinity)) {
    return "Победа через устойчивый портфель проектов.";
  }
  return `Закрыта большая цель: ${winner.grandGoal?.title || "личная цель"}.`;
}

function clearSession() {
  localStorage.removeItem("meshok.roomCode");
  localStorage.removeItem("meshok.playerId");
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
