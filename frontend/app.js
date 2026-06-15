let cells = [];
let projectCells = [];
let professions = [];
let ruleSummary = {};

const state = {
  roomCode: localStorage.getItem("meshok.roomCode"),
  playerId: localStorage.getItem("meshok.playerId"),
  spectatorId: localStorage.getItem("meshok.spectatorId"),
  user: null,
  game: null,
  presence: null,
  pollTimer: null,
  socket: null,
  reconnectTimer: null,
  heartbeatTimer: null,
  reconnectAttempt: 0
};

const authPanel = document.querySelector("#authPanel");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const resetRequestForm = document.querySelector("#resetRequestForm");
const resetPasswordForm = document.querySelector("#resetPasswordForm");
const profilePanel = document.querySelector("#profilePanel");
const profileForm = document.querySelector("#profileForm");
const verifyEmailForm = document.querySelector("#verifyEmailForm");
const changePasswordForm = document.querySelector("#changePasswordForm");
const resendVerificationButton = document.querySelector("#resendVerificationButton");
const logoutAllButton = document.querySelector("#logoutAllButton");
const emailStatus = document.querySelector("#emailStatus");
const profileTitle = document.querySelector("#profileTitle");
const profileEmail = document.querySelector("#profileEmail");
const profileName = document.querySelector("#profileName");
const profileStats = document.querySelector("#profileStats");
const profileRooms = document.querySelector("#profileRooms");
const profileHistory = document.querySelector("#profileHistory");
const historyPanel = document.querySelector("#historyPanel");
const historyNav = document.querySelector("#historyNav");
const historyCount = document.querySelector("#historyCount");
const historyList = document.querySelector("#historyList");
const rulesPanel = document.querySelector("#rulesPanel");
const rulesNav = document.querySelector("#rulesNav");
const rulesCount = document.querySelector("#rulesCount");
const rulesGoal = document.querySelector("#rulesGoal");
const rulesTurn = document.querySelector("#rulesTurn");
const rulesProfessions = document.querySelector("#rulesProfessions");
const rulesVictory = document.querySelector("#rulesVictory");
const rulesDebt = document.querySelector("#rulesDebt");
const rulesCells = document.querySelector("#rulesCells");
const openRulesButton = document.querySelector("#openRulesButton");
const roomsPanel = document.querySelector("#roomsPanel");
const publicRoomsList = document.querySelector("#publicRoomsList");
const myRoomsList = document.querySelector("#myRoomsList");
const refreshRoomsButton = document.querySelector("#refreshRoomsButton");
const homeNav = document.querySelector("#homeNav");
const roomsNav = document.querySelector("#roomsNav");
const profileNav = document.querySelector("#profileNav");
const logoutButton = document.querySelector("#logoutButton");
const createForm = document.querySelector("#createForm");
const joinForm = document.querySelector("#joinForm");
const setupPanel = document.querySelector("#setupPanel");
const gamePanel = document.querySelector("#gamePanel");
const roomBadge = document.querySelector("#roomBadge");
const gameStatusBar = document.querySelector("#gameStatusBar");
const statusKicker = document.querySelector("#statusKicker");
const statusTitle = document.querySelector("#statusTitle");
const statusText = document.querySelector("#statusText");
const statusMeta = document.querySelector("#statusMeta");
const roomTitle = document.querySelector("#roomTitle");
const roomCode = document.querySelector("#roomCode");
const inviteLink = document.querySelector("#inviteLink");
const copyInviteButton = document.querySelector("#copyInviteButton");
const roomSettingsPanel = document.querySelector("#roomSettingsPanel");
const roomTitleInput = document.querySelector("#roomTitleInput");
const roomPrivacyInput = document.querySelector("#roomPrivacyInput");
const roomMaxPlayersInput = document.querySelector("#roomMaxPlayersInput");
const roomGameLengthInput = document.querySelector("#roomGameLengthInput");
const roomVictoryModeInput = document.querySelector("#roomVictoryModeInput");
const saveRoomSettingsButton = document.querySelector("#saveRoomSettingsButton");
const readyButton = document.querySelector("#readyButton");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const turnButton = document.querySelector("#turnButton");
const leaveRoomButton = document.querySelector("#leaveRoomButton");
const archiveRoomButton = document.querySelector("#archiveRoomButton");
const message = document.querySelector("#message");
const players = document.querySelector("#players");
const board = document.querySelector("#board");
const log = document.querySelector("#log");
const debugLog = document.querySelector("#debugLog");
const resultPanel = document.querySelector("#resultPanel");
const dealPanel = document.querySelector("#dealPanel");
const marketPanel = document.querySelector("#marketPanel");
const decisionModal = document.querySelector("#decisionModal");
const decisionBackdrop = document.querySelector("#decisionBackdrop");
const decisionKicker = document.querySelector("#decisionKicker");
const decisionTitle = document.querySelector("#decisionTitle");
const decisionBody = document.querySelector("#decisionBody");
const decisionCloseButton = document.querySelector("#decisionCloseButton");
const onboardingModal = document.querySelector("#onboardingModal");
const skipOnboardingButton = document.querySelector("#skipOnboardingButton");
const finishOnboardingButton = document.querySelector("#finishOnboardingButton");
const onboardingRulesButton = document.querySelector("#onboardingRulesButton");
const reportPanel = document.querySelector("#reportPanel");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");

init();

window.addEventListener("hashchange", () => {
  runAction(renderRoute);
});

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
    navigateTo("/lobby");
    maybeShowOnboarding();
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
    showDevAuthHint(data.emailVerification, "Ссылка подтверждения email");
    navigateTo("/lobby");
    maybeShowOnboarding();
  });
});

resetRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const data = await api("/api/auth/request-password-reset", {
      method: "POST",
      body: { email: document.querySelector("#resetEmail").value }
    });
    showDevAuthHint(data.passwordReset, "Ссылка сброса пароля");
    roomBadge.textContent = "Если email найден, ссылка подготовлена.";
  });
});

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    await api("/api/auth/reset-password", {
      method: "POST",
      body: {
        token: document.querySelector("#resetToken").value,
        nextPassword: document.querySelector("#resetPassword").value
      }
    });
    document.querySelector("#resetToken").value = "";
    document.querySelector("#resetPassword").value = "";
    roomBadge.textContent = "Пароль обновлён. Можно войти.";
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

verifyEmailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const data = await api("/api/auth/verify-email", {
      method: "POST",
      body: { token: document.querySelector("#verifyEmailToken").value }
    });
    if (data.user) {
      await setUser(data.user);
    }
    document.querySelector("#verifyEmailToken").value = "";
    roomBadge.textContent = "Email подтверждён.";
  });
});

changePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    await api("/api/auth/change-password", {
      method: "POST",
      body: {
        currentPassword: document.querySelector("#currentPassword").value,
        nextPassword: document.querySelector("#newPassword").value
      }
    });
    document.querySelector("#currentPassword").value = "";
    document.querySelector("#newPassword").value = "";
    roomBadge.textContent = "Пароль изменён.";
  });
});

resendVerificationButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api("/api/auth/resend-verification", { method: "POST" });
    showDevAuthHint(data.emailVerification, data.alreadyVerified ? "Email уже подтверждён" : "Ссылка подтверждения email");
    await refreshMe();
  });
});

logoutAllButton.addEventListener("click", async () => {
  runAction(async () => {
    await api("/api/auth/logout-all", { method: "POST" });
    clearSession();
    state.user = null;
    navigateTo("/auth");
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
    navigateTo("/auth");
  });
});

homeNav.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("/lobby");
});

roomsNav.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("/rooms");
});

profileNav.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("/profile");
});

historyNav.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("/history");
});

rulesNav.addEventListener("click", (event) => {
  event.preventDefault();
  navigateTo("/rules");
});

openRulesButton.addEventListener("click", () => {
  navigateTo("/rules");
});

skipOnboardingButton.addEventListener("click", completeOnboarding);
finishOnboardingButton.addEventListener("click", completeOnboarding);
onboardingRulesButton.addEventListener("click", () => {
  completeOnboarding();
  navigateTo("/rules");
});

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  runAction(async () => {
    const name = document.querySelector("#createName").value.trim();
    const professionId = document.querySelector("#createProfession").value;
    const data = await api("/api/rooms", {
      method: "POST",
      body: {
        name,
        professionId,
        title: document.querySelector("#createRoomTitle").value.trim(),
        privacy: document.querySelector("#createRoomPrivacy").value,
        maxPlayers: Number(document.querySelector("#createMaxPlayers").value),
        gameLength: document.querySelector("#createGameLength").value,
        victoryMode: document.querySelector("#createVictoryMode").value
      }
    });
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

refreshRoomsButton.addEventListener("click", async () => {
  runAction(loadRoomsBrowser);
});

saveRoomSettingsButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/settings`, {
      method: "POST",
      body: {
        playerId: state.playerId,
        title: roomTitleInput.value,
        privacy: roomPrivacyInput.value,
        maxPlayers: Number(roomMaxPlayersInput.value),
        gameLength: roomGameLengthInput.value,
        victoryMode: roomVictoryModeInput.value
      }
    });
    await setGame(data.game);
  });
});

leaveRoomButton.addEventListener("click", async () => {
  runAction(async () => {
    const data = await api(`/api/rooms/${state.roomCode}/leave`, {
      method: "POST",
      body: { playerId: state.playerId, spectatorId: state.spectatorId }
    });
    clearRoomSession();
    state.game = null;
    state.roomCode = null;
    state.playerId = null;
    state.spectatorId = null;
    await refreshMe();
    navigateTo("/rooms");
    if (data.game?.archivedAt) {
      roomBadge.textContent = "Комната архивирована.";
    }
  });
});

archiveRoomButton.addEventListener("click", async () => {
  runAction(async () => {
    await api(`/api/rooms/${state.roomCode}/archive`, {
      method: "POST",
      body: { playerId: state.playerId }
    });
    clearRoomSession();
    state.game = null;
    state.roomCode = null;
    state.playerId = null;
    state.spectatorId = null;
    await refreshMe();
    navigateTo("/rooms");
    roomBadge.textContent = "Комната архивирована.";
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

decisionCloseButton.addEventListener("click", () => {
  decisionModal.classList.add("collapsed");
});

decisionBackdrop.addEventListener("click", () => {
  decisionModal.classList.add("collapsed");
});

async function init() {
  try {
    hideAllPanels();
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
      clearRoomSession();
      state.game = null;
      navigateTo("/auth", { replace: true });
      return;
    }
    maybeShowOnboarding();

    if (state.roomCode && (state.playerId || state.spectatorId)) {
      try {
        await refreshGame();
        connectRealtime();
        await renderRoute();
        return;
      } catch (error) {
        clearRoomSession();
        state.game = null;
        roomBadge.textContent = error.message || "Комната недоступна.";
      }
    }
    await renderRoute();
  } catch (error) {
    clearSession();
    state.user = null;
    state.game = null;
    navigateTo("/auth", { replace: true });
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
  state.spectatorId = null;
  localStorage.setItem("meshok.roomCode", code);
  localStorage.setItem("meshok.playerId", playerId);
  localStorage.removeItem("meshok.spectatorId");
  await refreshMe();
  await setGame(game);
  connectRealtime();
  navigateTo(roomRouteForGame(game));
}

async function enterSpectatorRoom(code, spectatorId, game) {
  state.roomCode = code;
  state.playerId = null;
  state.spectatorId = spectatorId;
  localStorage.setItem("meshok.roomCode", code);
  localStorage.removeItem("meshok.playerId");
  localStorage.setItem("meshok.spectatorId", spectatorId);
  await setGame(game);
  connectRealtime();
  navigateTo(roomRouteForGame(game));
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

async function refreshMe() {
  const session = await api("/api/me");
  await setUser(session.user);
}

async function setGame(game, presence = state.presence) {
  await ensureRulesLoaded();
  state.game = game;
  state.presence = presence || null;
  if ((state.playerId && !myPlayer()) || (state.spectatorId && !mySpectator())) {
    clearRoomSession();
    state.roomCode = null;
    state.playerId = null;
    state.spectatorId = null;
    state.game = null;
    setupPanel.classList.remove("hidden");
    gamePanel.classList.add("hidden");
    roomBadge.textContent = "Вы удалены из комнаты";
    navigateTo("/lobby");
    return;
  }
  const route = currentRoute();
  if ((route.name === "room" || route.name === "game" || route.name === "result") && route.code === game.roomCode) {
    setupPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
  }
  roomBadge.textContent = `${game.privacy === "public" ? "Публичная" : "Приватная"} · ${game.status}`;
  roomTitle.textContent = game.title || `Комната ${game.roomCode}`;
  roomCode.textContent = game.roomCode;
  inviteLink.value = inviteUrl();
  roomTitleInput.value = game.title || `Комната ${game.roomCode}`;
  roomPrivacyInput.value = game.privacy || "private";
  roomMaxPlayersInput.value = String(game.maxPlayers || 4);
  roomGameLengthInput.value = game.settings?.gameLength || "open";
  roomVictoryModeInput.value = game.settings?.victoryMode || "classic";
  renderPlayers();
  renderBoard();
  renderLog();
  renderDebugLog();
  renderResult();
  renderDeal();
  renderMarketOffer();
  renderReport();
  renderChat();
  updateControls();
  applyGameRouteMode();
}

function showAuth() {
  state.game = null;
  hideAllPanels();
  authPanel.classList.remove("hidden");
  roomBadge.textContent = "Войдите";
  updateStatusBar(null);
  setActiveNav(null);
}

function showLobby() {
  if (!state.user) {
    showAuth();
    return;
  }
  hideAllPanels();
  authPanel.classList.add("hidden");
  setupPanel.classList.remove("hidden");
  roomBadge.textContent = `Профиль: ${state.user.name}`;
  updateStatusBar(null);
  setActiveNav(homeNav);
}

function showProfile() {
  if (!state.user) {
    showAuth();
    return;
  }
  hideAllPanels();
  authPanel.classList.add("hidden");
  profilePanel.classList.remove("hidden");
  roomBadge.textContent = `Профиль: ${state.user.name}`;
  renderProfile();
  updateStatusBar(null);
  setActiveNav(profileNav);
}

async function showRooms() {
  if (!state.user) {
    showAuth();
    return;
  }
  hideAllPanels();
  authPanel.classList.add("hidden");
  roomsPanel.classList.remove("hidden");
  roomBadge.textContent = "Комнаты";
  updateStatusBar(null);
  setActiveNav(roomsNav);
  await loadRoomsBrowser();
}

function showHistory() {
  if (!state.user) {
    showAuth();
    return;
  }
  hideAllPanels();
  authPanel.classList.add("hidden");
  historyPanel.classList.remove("hidden");
  roomBadge.textContent = `История: ${state.user.name}`;
  renderHistoryPage();
  updateStatusBar(null);
  setActiveNav(historyNav);
}

function showRules() {
  if (!state.user) {
    showAuth();
    return;
  }
  hideAllPanels();
  authPanel.classList.add("hidden");
  rulesPanel.classList.remove("hidden");
  roomBadge.textContent = "Правила";
  renderRulesPage();
  updateStatusBar(null);
  setActiveNav(rulesNav);
}

function showRoomScreen() {
  if (!state.user) {
    showAuth();
    return;
  }
  if (!state.game) {
    showLobby();
    return;
  }
  hideAllPanels();
  gamePanel.classList.remove("hidden");
  gamePanel.classList.remove("result-screen");
  gamePanel.classList.add("room-screen");
  roomBadge.textContent = `Комната ${state.game.roomCode}`;
  updateControls();
  setActiveNav(roomsNav);
}

function showGameScreen() {
  if (!state.user) {
    showAuth();
    return;
  }
  if (!state.game) {
    showLobby();
    return;
  }
  hideAllPanels();
  gamePanel.classList.remove("hidden");
  gamePanel.classList.remove("room-screen", "result-screen");
  roomBadge.textContent = `Игра ${state.game.roomCode}`;
  updateControls();
  setActiveNav(null);
}

function showResultScreen() {
  if (!state.user) {
    showAuth();
    return;
  }
  if (!state.game) {
    showLobby();
    return;
  }
  hideAllPanels();
  gamePanel.classList.remove("hidden", "room-screen");
  gamePanel.classList.add("result-screen");
  roomBadge.textContent = `Итог ${state.game.roomCode}`;
  updateControls();
  setActiveNav(historyNav);
}

function hideAllPanels() {
  authPanel.classList.add("hidden");
  setupPanel.classList.add("hidden");
  profilePanel.classList.add("hidden");
  historyPanel.classList.add("hidden");
  rulesPanel.classList.add("hidden");
  roomsPanel.classList.add("hidden");
  gamePanel.classList.add("hidden");
}

function setActiveNav(active) {
  [homeNav, roomsNav, profileNav, historyNav, rulesNav].forEach((item) => item.classList.toggle("active", item === active));
}

async function renderRoute() {
  const route = currentRoute();
  if (!state.user) {
    showAuth();
    return;
  }
  if (route.name === "auth") {
    showLobby();
    return;
  }
  if (route.name === "rooms") {
    await showRooms();
    return;
  }
  if (route.name === "profile") {
    showProfile();
    return;
  }
  if (route.name === "history") {
    showHistory();
    return;
  }
  if (route.name === "rules") {
    showRules();
    return;
  }
  if ((route.name === "room" || route.name === "game" || route.name === "result") && route.code) {
    await ensureRouteRoom(route.code);
    if (!state.game) {
      showLobby();
      return;
    }
    if (route.name === "room") {
      showRoomScreen();
    } else if (route.name === "game") {
      showGameScreen();
    } else {
      showResultScreen();
    }
    return;
  }
  showLobby();
}

function currentRoute() {
  const raw = (window.location.hash || "#/lobby").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  const name = parts[0] || "lobby";
  return { name, code: parts[1]?.toUpperCase() || null };
}

function navigateTo(path, options = {}) {
  const nextHash = `#${path}`;
  if (window.location.hash === nextHash) {
    runAction(renderRoute);
    return;
  }
  if (options.replace) {
    window.history.replaceState(null, "", nextHash);
    runAction(renderRoute);
  } else {
    window.location.hash = nextHash;
  }
}

async function ensureRouteRoom(code) {
  if (state.game?.roomCode === code) {
    return;
  }
  if (state.roomCode !== code) {
    state.roomCode = code;
    localStorage.setItem("meshok.roomCode", code);
  }
  try {
    await refreshGame();
    connectRealtime();
  } catch (error) {
    showError(error.message || "Комната недоступна.");
    clearRoomSession();
  }
}

function roomRouteForGame(game) {
  if (game.status === "finished") {
    return `/result/${game.roomCode}`;
  }
  return game.status === "lobby" ? `/room/${game.roomCode}` : `/game/${game.roomCode}`;
}

function applyGameRouteMode() {
  if (!state.game) {
    return;
  }
  const route = currentRoute();
  const expected = roomRouteForGame(state.game);
  if ((route.name === "room" || route.name === "game" || route.name === "result") && route.code === state.game.roomCode) {
    gamePanel.classList.toggle("room-screen", route.name === "room");
    gamePanel.classList.toggle("result-screen", route.name === "result");
    if (state.game.status === "playing" && route.name === "room") {
      navigateTo(expected, { replace: true });
    }
    if (state.game.status === "lobby" && (route.name === "game" || route.name === "result")) {
      navigateTo(expected, { replace: true });
    }
    if (state.game.status === "playing" && route.name === "result") {
      navigateTo(expected, { replace: true });
    }
    if (state.game.status === "finished" && route.name === "game") {
      navigateTo(expected, { replace: true });
    }
  }
}

function renderProfile() {
  if (!state.user) {
    return;
  }
  const stats = state.user.stats || {};
  emailStatus.textContent = state.user.emailVerified
    ? `Email подтверждён${state.user.emailVerifiedAt ? `: ${formatDate(state.user.emailVerifiedAt)}` : "."}`
    : "Email пока не подтверждён.";
  resendVerificationButton.disabled = Boolean(state.user.emailVerified);
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
        state.spectatorId = null;
        localStorage.setItem("meshok.roomCode", state.roomCode);
        localStorage.setItem("meshok.playerId", state.playerId);
        localStorage.removeItem("meshok.spectatorId");
        await refreshGame();
        connectRealtime();
        navigateTo(roomRouteForGame(state.game));
      });
    });
  });
}

function renderHistoryPage() {
  const history = state.user?.history || [];
  historyCount.textContent = `${history.length} партий`;
  historyList.innerHTML = history.length
    ? history.map((item) => `
      <li>
        <span><strong>${item.won ? "Победа" : "Партия"}</strong> ${escapeHtml(item.roomCode)} · ${formatDate(item.finishedAt)}</span>
        <small>${money(item.netWorth)} капитал · ${money(item.passiveIncome)} инвестдоход · ${money(item.projectIncome || 0)} проекты · победитель ${escapeHtml(item.winnerName)}</small>
      </li>
    `).join("")
    : "<li>История появится после завершения партии</li>";
}

function renderRulesPage() {
  rulesCount.textContent = `${professions.length} профессий`;
  const gameLengths = ruleSummary.gameLengths || [];
  const victoryModes = ruleSummary.victoryModes || [];
  rulesGoal.innerHTML = `
    <p>Партия начинается на Денежном дворе. Игроки получают зарплату, покупают активы, закрывают долги и повышают репутацию.</p>
    <p>Когда репутация достигает ${ruleSummary.reputationGoal ?? 5}, а кэш покрывает ${ruleSummary.reserveMonthsGoal ?? 2} месяца расходов, игрок переходит в Лигу проектов.</p>
    <p>В Лиге проектов можно закрыть большую цель или собрать портфель: ${money(ruleSummary.projectIncomeGoal ?? 0)} дохода проектов и ${ruleSummary.projectPortfolioGoal ?? 0} проекта.</p>
  `;
  rulesTurn.innerHTML = `
    <ul class="rules-list">
      <li>На своём ходу игрок бросает кубик и попадает на клетку поля.</li>
      <li>Если появляется решение, модальное окно блокирует следующий ход до выбора.</li>
      <li>Сделки можно купить за наличные, с кредитом или пропустить.</li>
      <li>Ход переходит дальше после завершения всех pending decisions.</li>
    </ul>
  `;
  rulesProfessions.innerHTML = `
    <div class="rules-mini-grid">
      ${professions.map((profession) => `
        <span>
          <strong>${escapeHtml(profession.title)}</strong>
          Доход ${money(profession.salary)} · расход ${money(profession.expenses)} · кэш ${money(profession.cash)}
        </span>
      `).join("")}
    </div>
  `;
  rulesVictory.innerHTML = `
    <div class="rules-mini-grid">
      ${victoryModes.map((mode) => `<span><strong>${escapeHtml(mode.title)}</strong>${victoryModeDescription(mode.id)}</span>`).join("")}
      ${gameLengths.map((item) => `<span><strong>${escapeHtml(item.title)}</strong>${item.maxTurns ? `${item.maxTurns} ходов до оценки капитала` : "без лимита ходов"}</span>`).join("")}
    </div>
  `;
  rulesDebt.innerHTML = `
    <ul class="rules-list">
      <li>Кредиты повышают расходы, но позволяют купить актив раньше.</li>
      <li>Рынок может дать кэш, просадку или предложение продать актив.</li>
      <li>При глубоком минусе открывается модальное финансовое решение: автоликвидация актива, реструктуризация долга, банкротство.</li>
      <li>Банкротство снижает репутацию, обнуляет кэш и заставляет пропустить ход.</li>
    </ul>
  `;
  const cellCounts = countBy(cells.map(([type]) => type));
  const projectCellCounts = countBy(projectCells.map(([type]) => type));
  rulesCells.innerHTML = `
    <div class="rules-mini-grid">
      ${Object.entries(cellCounts).map(([type, count]) => `<span><strong>${cellLabel(type)}</strong>${count} на Денежном дворе</span>`).join("")}
      ${Object.entries(projectCellCounts).map(([type, count]) => `<span><strong>${cellLabel(type)}</strong>${count} в Лиге проектов</span>`).join("")}
    </div>
  `;
}

function victoryModeDescription(id) {
  return {
    classic: "цель или портфель проектов",
    goal: "победа только через большую цель",
    portfolio: "победа только через портфель проектов",
    netWorth: "победа по капиталу после лимита ходов"
  }[id] || "особый режим";
}

function cellLabel(type) {
  return {
    payday: "Зарплата",
    opportunity: "Возможность",
    expense: "Расход",
    market: "Рынок",
    charity: "Благотворительность",
    downsized: "Сокращение",
    "money-day": "Деньги",
    "fast-deal": "Бизнес",
    goal: "Цель",
    "tax-audit": "Налоги"
  }[type] || type;
}

function countBy(items) {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function maybeShowOnboarding() {
  if (!state.user || localStorage.getItem("meshok.onboarding.v1") === "done") {
    return;
  }
  onboardingModal.classList.remove("hidden");
}

function completeOnboarding() {
  localStorage.setItem("meshok.onboarding.v1", "done");
  onboardingModal.classList.add("hidden");
}

async function loadRoomsBrowser() {
  const data = await api("/api/rooms");
  renderRoomsBrowser(data.rooms || []);
}

function renderRoomsBrowser(roomItems) {
  const publicRooms = roomItems.filter((room) => room.privacy === "public");
  const myRooms = roomItems.filter((room) => room.isPlayer || room.isSpectator);
  publicRoomsList.innerHTML = renderRoomList(publicRooms, "Публичных комнат пока нет");
  myRoomsList.innerHTML = renderRoomList(myRooms, "Ваших активных комнат пока нет");

  roomsPanel.querySelectorAll("[data-room-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const roomCodeValue = button.dataset.roomCode;
      const action = button.dataset.roomAction;
      const playerId = button.dataset.playerId;
      const spectatorId = button.dataset.spectatorId;
      runAction(async () => {
        if (action === "open-player") {
          state.roomCode = roomCodeValue;
          state.playerId = playerId;
          state.spectatorId = null;
          localStorage.setItem("meshok.roomCode", state.roomCode);
          localStorage.setItem("meshok.playerId", state.playerId);
          localStorage.removeItem("meshok.spectatorId");
          await refreshGame();
          connectRealtime();
          navigateTo(roomRouteForGame(state.game));
          return;
        }
        if (action === "open-spectator") {
          state.roomCode = roomCodeValue;
          state.playerId = null;
          state.spectatorId = spectatorId;
          localStorage.setItem("meshok.roomCode", state.roomCode);
          localStorage.removeItem("meshok.playerId");
          localStorage.setItem("meshok.spectatorId", state.spectatorId);
          await refreshGame();
          connectRealtime();
          navigateTo(roomRouteForGame(state.game));
          return;
        }
        if (action === "join") {
          const name = document.querySelector("#joinName").value.trim() || state.user.name;
          const professionId = document.querySelector("#joinProfession").value;
          const data = await api(`/api/rooms/${roomCodeValue}/join`, { method: "POST", body: { name, professionId } });
          await enterRoom(roomCodeValue, data.playerId, data.game);
          return;
        }
        const data = await api(`/api/rooms/${roomCodeValue}/spectate`, {
          method: "POST",
          body: { name: state.user.name }
        });
        await enterSpectatorRoom(roomCodeValue, data.spectatorId, data.game);
      });
    });
  });
}

function renderRoomList(roomItems, emptyText) {
  if (!roomItems.length) {
    return `<li class="room-list-empty">${emptyText}</li>`;
  }
  return roomItems.map((room) => {
    const canJoin = room.status === "lobby" && room.playerCount < room.maxPlayers && !room.isPlayer && !room.isSpectator;
    const openAction = room.isPlayer
      ? `<button class="mini-button" data-room-action="open-player" data-room-code="${escapeHtml(room.roomCode)}" data-player-id="${escapeHtml(room.playerId || "")}">Открыть</button>`
      : room.isSpectator
        ? `<button class="mini-button" data-room-action="open-spectator" data-room-code="${escapeHtml(room.roomCode)}" data-spectator-id="${escapeHtml(room.spectatorId || "")}">Открыть</button>`
        : "";
    const joinAction = canJoin
      ? `<button class="mini-button" data-room-action="join" data-room-code="${escapeHtml(room.roomCode)}">Играть</button>`
      : "";
    const spectateAction = !room.isPlayer && !room.isSpectator
      ? `<button class="mini-button secondary" data-room-action="spectate" data-room-code="${escapeHtml(room.roomCode)}">Смотреть</button>`
      : "";
    return `
      <li class="room-list-item">
        <div>
          <strong>${escapeHtml(room.title)}</strong>
          <span>${escapeHtml(room.roomCode)} · ${room.privacy === "public" ? "публичная" : "приватная"} · ${escapeHtml(room.status)}</span>
          <small>${room.playerCount}/${room.maxPlayers} игроков · ${room.spectatorCount} зрителей · хост ${escapeHtml(room.host)}</small>
        </div>
        <div class="room-list-actions">${openAction}${joinAction}${spectateAction}</div>
      </li>
    `;
  }).join("");
}

function showDevAuthHint(payload, title) {
  if (!payload) {
    return;
  }
  const text = payload.url || payload.token || title;
  roomBadge.textContent = text;
  if (payload.token && title.includes("подтверждения")) {
    document.querySelector("#verifyEmailToken").value = payload.token;
  }
  if (payload.token && title.includes("сброса")) {
    document.querySelector("#resetToken").value = payload.token;
  }
}

function renderPlayers() {
  players.innerHTML = "";
  const me = myPlayer();
  const isHost = me?.id === state.game.hostId;
  state.game.players.forEach((player) => {
    const presence = playerPresence(player.id);
    const connectionMark = `<span class="player-mark ${presence.connected ? "online-mark" : "offline-mark"}">${presence.connected ? "online" : "disconnected"}</span>`;
    const card = document.createElement("article");
    card.className = "player-card";
    if (player.id === state.game.currentPlayerId) card.classList.add("active");
    if (player.id === state.game.winnerId) card.classList.add("winner");
    const hostMark = player.id === state.game.hostId ? `<span class="player-mark host-mark">Хост</span>` : "";
    const bankruptcyMark = player.bankruptcyCount ? `<span class="player-mark offline-mark">банкротств ${player.bankruptcyCount}</span>` : "";
    const readyMark = state.game.status === "lobby"
      ? `<span class="player-mark ${player.ready || player.id === state.game.hostId ? "ready-mark" : ""}">${player.id === state.game.hostId ? "управляет" : player.ready ? "готов" : "не готов"}</span>`
      : "";
    const kickButton = isHost && player.id !== state.game.hostId && state.game.status === "lobby"
      ? `<button class="mini-button secondary" data-kick="${escapeHtml(player.id)}">Кик</button>`
      : "";
    const transferButton = isHost && player.id !== state.game.hostId
      ? `<button class="mini-button secondary" data-transfer-host="${escapeHtml(player.id)}">Хост</button>`
      : "";
    card.innerHTML = `
      <div class="player-name">
        <span>${escapeHtml(player.name)}</span>
        <span>${player.lastRoll ? `D6 ${player.lastRoll}` : ""}</span>
      </div>
      <div class="player-flags">${hostMark}${readyMark}${connectionMark}${bankruptcyMark}${transferButton}${kickButton}</div>
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
        ${player.bankruptcyCount ? `<span>Банкротств<strong>${player.bankruptcyCount}</strong></span>` : ""}
        <span>Активы<strong>${player.assets.length}</strong></span>
        ${player.track === "project-league" ? `<span>Проекты<strong>${money(player.projectIncome ?? 0)}</strong></span>` : ""}
      </div>
    `;
    players.append(card);
  });

  if (state.game.spectators?.length) {
    const list = document.createElement("article");
    list.className = "spectator-card";
    list.innerHTML = `
      <div class="player-name">
        <span>Наблюдатели</span>
        <span>${state.game.spectators.length}</span>
      </div>
      <div class="spectator-list">${state.game.spectators.map((item) => {
        const presence = spectatorPresence(item.id);
        return `<span class="${presence.connected ? "online-mark" : "offline-mark"}">${escapeHtml(item.name)}</span>`;
      }).join("")}</div>
    `;
    players.append(list);
  }

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

  players.querySelectorAll("[data-transfer-host]").forEach((button) => {
    button.addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/transfer-host`, {
          method: "POST",
          body: { playerId: state.playerId, targetPlayerId: button.dataset.transferHost }
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

function renderDebugLog() {
  debugLog.innerHTML = "";
  (state.game.debugLog || []).slice(-30).reverse().forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `#${item.turnCount ?? 0} R${item.round ?? 1} ${item.type}`;
    debugLog.append(li);
  });
}

function renderResult() {
  if (state.game.status !== "finished") {
    resultPanel.classList.add("hidden");
    resultPanel.innerHTML = "";
    return;
  }

  const winner = state.game.players.find((player) => player.id === state.game.winnerId);
  const isHost = myPlayer()?.id === state.game.hostId;
  const rows = state.game.players
    .map((player) => {
      const netWorth = player.cash + player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0) - (player.liabilityBalance || 0);
      return `
        <li class="${player.id === state.game.winnerId ? "winner-row" : ""}">
          <span>${escapeHtml(player.name)}</span>
          <strong>${money(netWorth)}</strong>
          <small>${money(player.passiveIncome)} инвестдоход · ${money(player.projectIncome || 0)} проекты · ${player.projectAssetCount ?? 0} проектов · банкротств ${player.bankruptcyCount || 0}</small>
        </li>
      `;
    })
    .join("");
  const keyEvents = (state.game.log || [])
    .filter((item) => /выигрывает|побеждает|банкротство|реструктуризация|переходит|портфель|цель/i.test(item))
    .slice(0, 5)
    .map((item) => `<li><span>${escapeHtml(item)}</span></li>`)
    .join("");

  resultPanel.classList.remove("hidden");
  resultPanel.innerHTML = `
    <p class="eyebrow">Итог партии</p>
    <h2>${escapeHtml(winner?.name || "Игрок")} победил</h2>
    <p>${escapeHtml(victoryReason(winner))}</p>
    <ul class="result-list">${rows}</ul>
    <h3>Ключевые события</h3>
    <ul class="result-list">${keyEvents || "<li><span>События партии сохранены в журнале.</span></li>"}</ul>
    <div class="deal-actions result-actions">
      <button id="resultRestartButton" ${!isHost ? "disabled" : ""}>Новая игра</button>
      <button id="resultRoomButton" class="secondary">Назад в комнату</button>
      <button id="resultProfileButton" class="secondary">Профиль</button>
      <button id="resultHistoryButton" class="secondary">История</button>
    </div>
  `;

  document.querySelector("#resultRestartButton").addEventListener("click", () => {
    if (!isHost) {
      return;
    }
    restartButton.click();
  });
  document.querySelector("#resultRoomButton").addEventListener("click", () => navigateTo(`/room/${state.game.roomCode}`));
  document.querySelector("#resultProfileButton").addEventListener("click", () => navigateTo("/profile"));
  document.querySelector("#resultHistoryButton").addEventListener("click", () => navigateTo("/history"));
}

function renderDeal() {
  const me = myPlayer();
  dealPanel.classList.add("hidden");
  dealPanel.innerHTML = "";
  if (me?.pendingFinancialStress) {
    const stress = me.pendingFinancialStress;
    const steps = [
      stress.canLiquidate ? `Продажа актива: ${stress.assetTitle || "самый ликвидный актив"}.` : "",
      stress.canRestructure ? `Реструктуризация долга: ${stress.liabilityTitle || "крупнейший долг"}.` : "",
      stress.bankruptcy ? "Если минус останется критическим, будет банкротство: кэш 0, минус репутация, пропуск хода." : ""
    ].filter(Boolean);
    showDecisionModal("Финансовый стресс", stress.bankruptcy ? "Банкротство / реструктуризация" : "Реструктуризация", `
      <p>Баланс ушёл ниже безопасного уровня. Заверши финансовое решение, чтобы передать ход дальше.</p>
      <div class="decision-grid">
        <span>Текущий кэш<strong>${money(stress.cash)}</strong></span>
        <span>Кризисный порог<strong>${money(stress.crisisLimit)}</strong></span>
      </div>
      <ul class="decision-list">
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ul>
      <div class="deal-actions">
        <button id="confirmStressButton">Принять план</button>
        <button id="reviewReportButton" class="secondary">Отчёт игрока</button>
      </div>
    `);

    document.querySelector("#confirmStressButton").addEventListener("click", async () => {
      runAction(async () => {
        const data = await api(`/api/rooms/${state.roomCode}/confirm-financial-stress`, {
          method: "POST",
          body: { playerId: state.playerId }
        });
        await setGame(data.game);
      });
    });

    document.querySelector("#reviewReportButton").addEventListener("click", () => {
      decisionModal.classList.add("collapsed");
      reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return;
  }

  if (me?.pendingProjectDeal) {
    const deal = me.pendingProjectDeal;
    const upkeep = deal.upkeep || 0;
    const netIncome = Math.max(0, deal.passiveIncome - upkeep);
    showDecisionModal("Проект", deal.title, `
      <p>${escapeHtml(deal.text)}</p>
      <div class="decision-grid">
        <span>Вход<strong>${money(deal.cost)}</strong></span>
        <span>Оценка<strong>${money(deal.marketValue ?? deal.cost)}</strong></span>
        <span>Доход проектов<strong>+${money(deal.passiveIncome)}</strong></span>
        <span>Обслуживание<strong>${money(upkeep)}</strong></span>
        <span>Чистый поток<strong>+${money(netIncome)}</strong></span>
      </div>
      <div class="deal-actions">
        <button id="buyProjectButton" ${me.cash < deal.cost ? "disabled" : ""}>Вложиться</button>
        <button id="passProjectButton" class="secondary">Пропустить</button>
      </div>
    `);

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
    showDecisionModal("Возможность", "Выбор сделки", `
      <p>Выбери малую сделку с меньшим входом или крупную сделку с большим потенциалом и риском.</p>
      <div class="deal-actions">
        <button id="smallDealButton">Малая</button>
        <button id="largeDealButton">Крупная</button>
        <button id="skipDealChoiceButton" class="secondary">Пропустить</button>
      </div>
    `);

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
    if (!me?.pendingMarketOffer) {
      hideDecisionModal();
    }
    return;
  }

  const deal = me.pendingOpportunity;
  showDecisionModal("Сделка", deal.title, `
    <p>${escapeHtml(deal.text)}</p>
    <div class="decision-grid">
      <span>Тип<strong>${deal.type === "large" ? "Крупная" : "Малая"}</strong></span>
      <span>Цена<strong>${money(deal.cost)}</strong></span>
      <span>Взнос<strong>${money(deal.downPayment ?? deal.cost)}</strong></span>
      <span>Кредит<strong>${money(deal.loan ?? 0)}</strong></span>
      <span>Платёж<strong>${money(deal.payment ?? 0)}</strong></span>
      <span>Инвестдоход<strong>+${money(deal.passiveIncome)}</strong></span>
    </div>
    <div class="deal-actions">
      <button id="buyCashButton" ${me.cash < deal.cost ? "disabled" : ""}>За наличные</button>
      <button id="buyFinanceButton" ${(deal.loan || 0) <= 0 || me.cash < (deal.downPayment ?? deal.cost) ? "disabled" : ""}>С кредитом</button>
      <button id="passButton" class="secondary">Пропустить</button>
    </div>
  `);

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

function showDecisionModal(kicker, title, bodyHtml) {
  decisionKicker.textContent = kicker;
  decisionTitle.textContent = title;
  decisionBody.innerHTML = bodyHtml;
  decisionModal.classList.remove("hidden", "collapsed");
}

function hideDecisionModal() {
  decisionModal.classList.add("hidden");
  decisionModal.classList.remove("collapsed");
  decisionBody.innerHTML = "";
}

function renderMarketOffer() {
  const me = myPlayer();
  marketPanel.classList.add("hidden");
  marketPanel.innerHTML = "";
  if (!me?.pendingMarketOffer) {
    return;
  }

  const offer = me.pendingMarketOffer;
  showDecisionModal("Рынок", offer.title, `
    <p>${escapeHtml(offer.text)}</p>
    <div class="decision-grid">
      <span>Актив<strong>${escapeHtml(offer.assetTitle)}</strong></span>
      <span>Цена продажи<strong>${money(offer.price)}</strong></span>
    </div>
    <div class="deal-actions">
      <button id="acceptMarketButton">Продать</button>
      <button id="declineMarketButton" class="secondary">Оставить</button>
    </div>
  `);

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
  const isSpectator = Boolean(mySpectator());
  const isMyTurn = game.currentPlayerId === state.playerId;
  const hasPendingDeal = Boolean(me?.pendingOpportunity || me?.pendingOpportunityChoice || me?.pendingMarketOffer || me?.pendingProjectDeal || me?.pendingFinancialStress);
  const notReadyPlayers = game.players.filter((player) => player.id !== game.hostId && !player.ready);

  roomSettingsPanel.classList.toggle("hidden", !isHost || Boolean(game.archivedAt));
  saveRoomSettingsButton.disabled = !isHost || Boolean(game.archivedAt);
  archiveRoomButton.classList.toggle("hidden", !isHost || Boolean(game.archivedAt));
  leaveRoomButton.classList.toggle("hidden", Boolean(game.archivedAt));
  readyButton.classList.toggle("hidden", game.status !== "lobby" || isHost || isSpectator);
  readyButton.textContent = me?.ready ? "Не готов" : "Готов";
  readyButton.disabled = game.status !== "lobby" || isHost || isSpectator;
  startButton.classList.toggle("hidden", !isHost || game.status !== "lobby");
  startButton.disabled = game.status !== "lobby" || !isHost || notReadyPlayers.length > 0;
  restartButton.classList.toggle("hidden", !isHost || game.status !== "finished");
  restartButton.disabled = game.status !== "finished" || !isHost;
  turnButton.disabled = isSpectator || game.status !== "playing" || !isMyTurn || hasPendingDeal;
  turnButton.classList.toggle("hidden", game.status === "finished" || isSpectator);
  chatInput.disabled = isSpectator || Boolean(game.archivedAt);
  chatForm.querySelector("button").disabled = isSpectator || Boolean(game.archivedAt);

  if (game.archivedAt) {
    message.textContent = "Комната архивирована.";
    updateStatusBar({ kicker: "Комната", title: "Архивирована", text: "Комната больше недоступна для действий.", tone: "danger" });
    return;
  }

  if (isSpectator) {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    message.textContent = game.status === "playing" ? `Режим наблюдателя. Ход игрока ${current?.name || "..."}.` : "Режим наблюдателя.";
    updateStatusBar({
      kicker: "Наблюдение",
      title: game.status === "playing" ? `Ходит ${current?.name || "игрок"}` : "Комната открыта",
      text: game.status === "playing" ? "Вы смотрите партию без права хода." : waitingText(game, notReadyPlayers),
      tone: "neutral"
    });
    return;
  }

  if (game.status === "lobby") {
    message.textContent = isHost
      ? notReadyPlayers.length > 0 ? `Ждём готовность: ${notReadyPlayers.map((player) => player.name).join(", ")}.` : "Все готовы. Можно начинать игру."
      : me?.ready ? "Ты готов. Ждём старт от хоста." : "Отметь готовность, когда можно начинать.";
    updateStatusBar({
      kicker: "Комната",
      title: notReadyPlayers.length > 0 ? "Ждём игроков" : "Готово к старту",
      text: waitingText(game, notReadyPlayers),
      tone: notReadyPlayers.length > 0 ? "waiting" : "ready"
    });
  } else if (game.status === "finished") {
    const winner = game.players.find((player) => player.id === game.winnerId);
    message.textContent = isHost ? `${winner?.name || "Игрок"} победил. Можно начать новую игру в этой комнате.` : `${winner?.name || "Игрок"} победил. Ждём рестарт от хоста.`;
    updateStatusBar({
      kicker: "Итог",
      title: `${winner?.name || "Игрок"} победил`,
      text: isHost ? "Можно начать новую партию в этой комнате." : "Ждём решение хоста о новой партии.",
      tone: "ready"
    });
  } else if (isMyTurn) {
    message.textContent = hasPendingDeal ? "Заверши текущее решение, затем ход перейдёт дальше." : me?.track === "project-league" ? "Твой ход в Лиге проектов." : "Твой ход.";
    updateStatusBar({
      kicker: "Ход",
      title: hasPendingDeal ? "Заверши решение" : "Твой ход",
      text: hasPendingDeal ? pendingDecisionText(me) : "Можно бросить кубик и продолжить партию.",
      tone: "turn"
    });
  } else {
    const current = game.players.find((player) => player.id === game.currentPlayerId);
    message.textContent = `Ход игрока ${current?.name || "..."}.`;
    updateStatusBar({
      kicker: "Ход",
      title: `Ходит ${current?.name || "игрок"}`,
      text: disconnectedPlayersText(game) || "Следите за событиями партии.",
      tone: disconnectedPlayersText(game) ? "danger" : "neutral"
    });
  }
}

function updateStatusBar(status) {
  if (!status) {
    gameStatusBar.classList.add("hidden");
    return;
  }
  gameStatusBar.classList.remove("hidden");
  gameStatusBar.classList.remove("status-waiting", "status-ready", "status-turn", "status-danger", "status-neutral");
  if (status.tone && status.tone !== "neutral") {
    gameStatusBar.classList.add(`status-${status.tone}`);
  }
  statusKicker.textContent = status.kicker || "Статус";
  statusTitle.textContent = status.title || "Комната";
  statusText.textContent = status.text || "";
  const disconnected = disconnectedPlayersText(state.game);
  statusMeta.innerHTML = [
    state.game ? `<span>${state.game.players.length}/${state.game.maxPlayers || 4} игроков</span>` : "",
    state.game?.round ? `<span>Раунд ${state.game.round}</span>` : "",
    disconnected ? `<span class="danger-text">${escapeHtml(disconnected)}</span>` : ""
  ].filter(Boolean).join("");
}

function waitingText(game, notReadyPlayers) {
  const disconnected = disconnectedPlayersText(game);
  if (disconnected) {
    return disconnected;
  }
  if (game.players.length < (game.maxPlayers || 4)) {
    return `Можно пригласить ещё ${Math.max(0, (game.maxPlayers || 4) - game.players.length)} игрока.`;
  }
  if (notReadyPlayers.length > 0) {
    return `Ждём готовность: ${notReadyPlayers.map((player) => player.name).join(", ")}.`;
  }
  return "Все игроки готовы.";
}

function disconnectedPlayersText(game) {
  if (!game || !state.presence?.players) {
    return "";
  }
  const offline = game.players
    .filter((player) => !playerPresence(player.id).connected)
    .map((player) => player.name);
  return offline.length ? `Отключились: ${offline.join(", ")}.` : "";
}

function pendingDecisionText(player) {
  if (player.pendingOpportunityChoice) return "Выберите малую или крупную сделку.";
  if (player.pendingOpportunity) return "Решите, покупать сделку или пропустить.";
  if (player.pendingMarketOffer) return "Примите или отклоните рыночное предложение.";
  if (player.pendingProjectDeal) return "Решите, инвестировать в проект или пропустить.";
  if (player.pendingFinancialStress) return "Подтвердите реструктуризацию или банкротство.";
  return "Завершите текущее действие.";
}

async function refreshGame() {
  const data = await api(`/api/rooms/${state.roomCode}`);
  await setGame(data.game, data.presence);
}

function connectRealtime() {
  disconnectRealtime();
  stopPolling();

  if (typeof WebSocket !== "function") {
    startPolling();
    return;
  }

  const params = new URLSearchParams({ room: state.roomCode || "" });
  if (state.playerId) params.set("playerId", state.playerId);
  if (state.spectatorId) params.set("spectatorId", state.spectatorId);
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws?${params}`);
  socket.shouldReconnect = true;
  state.socket = socket;

  socket.addEventListener("open", () => {
    state.reconnectAttempt = 0;
    stopPolling();
    startHeartbeat();
    if (state.game) {
      message.textContent = "Связь с комнатой восстановлена.";
    }
  });
  socket.addEventListener("message", (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (data.game) {
      setGame(data.game, data.presence).catch((error) => showError(error.message || "Не удалось обновить игру."));
    }
  });
  socket.addEventListener("close", () => {
    stopHeartbeat();
    const shouldReconnect = socket.shouldReconnect !== false;
    if (state.socket === socket) {
      state.socket = null;
    }
    if (shouldReconnect) {
      startPolling();
      if (state.game) {
        message.textContent = "Связь потеряна. Восстанавливаю комнату...";
      }
      scheduleReconnect();
    }
  });
  socket.addEventListener("error", () => {
    socket.close();
  });
}

function disconnectRealtime() {
  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
  stopHeartbeat();
  if (state.socket) {
    state.socket.shouldReconnect = false;
    state.socket.close();
    state.socket = null;
  }
}

function scheduleReconnect() {
  clearTimeout(state.reconnectTimer);
  if (!state.roomCode || (!state.playerId && !state.spectatorId)) {
    return;
  }
  state.reconnectAttempt += 1;
  const delay = Math.min(8000, 600 * state.reconnectAttempt);
  state.reconnectTimer = window.setTimeout(() => {
    refreshGame().catch(() => {});
    connectRealtime();
  }, delay);
}

function startHeartbeat() {
  stopHeartbeat();
  state.heartbeatTimer = window.setInterval(() => {
    if (state.socket?.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify({ type: "heartbeat", at: Date.now() }));
    }
  }, 15000);
}

function stopHeartbeat() {
  clearInterval(state.heartbeatTimer);
  state.heartbeatTimer = null;
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

function mySpectator() {
  return state.game?.spectators?.find((spectator) => spectator.id === state.spectatorId);
}

function playerPresence(playerId) {
  const item = state.presence?.players?.find((entry) => entry.id === playerId);
  return item || { connected: false, lastSeenAt: null };
}

function spectatorPresence(spectatorId) {
  const item = state.presence?.spectators?.find((entry) => entry.id === spectatorId);
  return item || { connected: false, lastSeenAt: null };
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
  clearRoomSession();
  state.game = null;
  state.presence = null;
  localStorage.removeItem("meshok.roomCode");
  localStorage.removeItem("meshok.playerId");
  localStorage.removeItem("meshok.spectatorId");
  disconnectRealtime();
  stopPolling();
}

function clearRoomSession() {
  localStorage.removeItem("meshok.roomCode");
  localStorage.removeItem("meshok.playerId");
  localStorage.removeItem("meshok.spectatorId");
  state.roomCode = null;
  state.playerId = null;
  state.spectatorId = null;
  state.presence = null;
  disconnectRealtime();
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

function formatDate(timestamp) {
  return new Date(Number(timestamp)).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
