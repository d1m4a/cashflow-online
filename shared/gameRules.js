const BOARD_SIZE = 18;
const PROJECT_BOARD_SIZE = 12;
const PROJECT_INCOME_GOAL = 6200;
const PROJECT_PORTFOLIO_GOAL = 3;
const REPUTATION_GOAL = 5;
const RESERVE_MONTHS_GOAL = 2;

const PROFESSIONS = [
  {
    id: "courier-curator",
    title: "Куратор доставок",
    salary: 3000,
    expenses: 2140,
    cash: 1050,
    liabilities: [
      { title: "Рассрочка на скутер", payment: 260, balance: 6200 },
      { title: "Долг за обучение", payment: 120, balance: 2800 }
    ]
  },
  {
    id: "event-host",
    title: "Ведущий событий",
    salary: 3700,
    expenses: 2520,
    cash: 1500,
    liabilities: [
      { title: "Кредит на аппаратуру", payment: 260, balance: 8200 }
    ]
  },
  {
    id: "lab-technician",
    title: "Техник лаборатории",
    salary: 4550,
    expenses: 3220,
    cash: 2100,
    liabilities: [
      { title: "Семейный заём", payment: 340, balance: 9800 },
      { title: "Рассрочка на ноутбук", payment: 210, balance: 4700 }
    ]
  },
  {
    id: "repair-master",
    title: "Мастер ремонта",
    salary: 3850,
    expenses: 2680,
    cash: 1850,
    liabilities: [
      { title: "Кредит на инструменты", payment: 300, balance: 8800 }
    ]
  },
  {
    id: "content-editor",
    title: "Редактор контента",
    salary: 3350,
    expenses: 2300,
    cash: 1600,
    liabilities: [
      { title: "Карта с лимитом", payment: 210, balance: 4800 }
    ]
  }
];

const CELLS = [
  { type: "payday", label: "Зарплата" },
  { type: "opportunity", label: "Возможность" },
  { type: "expense", label: "Расход" },
  { type: "market", label: "Рынок" },
  { type: "opportunity", label: "Возможность" },
  { type: "charity", label: "Благотворительность" },
  { type: "payday", label: "Зарплата" },
  { type: "expense", label: "Расход" },
  { type: "opportunity", label: "Возможность" },
  { type: "downsized", label: "Сокращение" },
  { type: "market", label: "Рынок" },
  { type: "expense", label: "Расход" },
  { type: "opportunity", label: "Возможность" },
  { type: "payday", label: "Зарплата" },
  { type: "expense", label: "Расход" },
  { type: "opportunity", label: "Возможность" },
  { type: "market", label: "Рынок" },
  { type: "payday", label: "Зарплата" }
];

const PROJECT_CELLS = [
  { type: "money-day", label: "Деньги" },
  { type: "fast-deal", label: "Бизнес" },
  { type: "market", label: "Рынок" },
  { type: "goal", label: "Цель" },
  { type: "money-day", label: "Деньги" },
  { type: "charity", label: "Благотворительность" },
  { type: "fast-deal", label: "Бизнес" },
  { type: "tax-audit", label: "Налоги" },
  { type: "goal", label: "Цель" },
  { type: "money-day", label: "Деньги" },
  { type: "fast-deal", label: "Бизнес" },
  { type: "market", label: "Рынок" }
];

const GRAND_GOALS = [
  { id: "city-workshop", title: "Городская мастерская", cost: 15000, text: "Открыть общественное пространство, где люди учатся чинить вещи и запускать маленькие дела." },
  { id: "family-trust", title: "Семейный фонд свободы", cost: 13500, text: "Создать резерв, который оплачивает год жизни семьи без обязательной работы." },
  { id: "creative-yard", title: "Двор творческих проектов", cost: 17200, text: "Собрать площадку для концертов, лекций, ярмарок и локальных брендов." },
  { id: "quiet-house", title: "Дом без будильника", cost: 16000, text: "Купить спокойное место, где доходы проектов оплачивают быт." },
  { id: "learning-lab", title: "Лаборатория навыков", cost: 14200, text: "Запустить школу практических финансовых и ремесленных навыков." }
];

const OPPORTUNITY_CARDS = [
  {
    id: "snack-shelf",
    type: "small",
    title: "Полка домашних снеков",
    text: "Мини-витрина у знакомой кофейни: орехи, батончики и честная коробка.",
    cost: 700,
    downPayment: 700,
    loan: 0,
    payment: 0,
    marketValue: 880,
    passiveIncome: 90
  },
  {
    id: "tool-rental",
    type: "small",
    title: "Ящик инструментов в аренду",
    text: "Набор редких инструментов сдаётся соседям и маленьким бригадам.",
    cost: 1250,
    downPayment: 520,
    loan: 730,
    payment: 70,
    marketValue: 1550,
    passiveIncome: 185
  },
  {
    id: "micro-newsletter",
    type: "small",
    title: "Платная рассылка района",
    text: "Афиша, скидки и полезные контакты для жителей квартала.",
    cost: 850,
    downPayment: 850,
    loan: 0,
    payment: 0,
    marketValue: 1050,
    passiveIncome: 110
  },
  {
    id: "laundry-corner",
    type: "large",
    title: "Прачечный уголок",
    text: "Две машины самообслуживания в проходном месте.",
    cost: 3000,
    downPayment: 1150,
    loan: 1850,
    payment: 190,
    marketValue: 3900,
    passiveIncome: 440
  },
  {
    id: "storage-cells",
    type: "large",
    title: "Кладовки для самозанятых",
    text: "Маленькие боксы под хранение реквизита, товара и инструментов.",
    cost: 4300,
    downPayment: 1550,
    loan: 2750,
    payment: 290,
    marketValue: 5600,
    passiveIncome: 720
  },
  {
    id: "mobile-stage",
    type: "large",
    title: "Мобильная сцена",
    text: "Сборная сцена сдаётся на ярмарки, праздники и лекции.",
    cost: 5900,
    downPayment: 2050,
    loan: 3850,
    payment: 430,
    marketValue: 7600,
    passiveIncome: 980
  }
];

const EXPENSE_CARDS = [
  { title: "Затопило кухню", amount: 460 },
  { title: "Срочный подарок родственнику", amount: 320 },
  { title: "Платный приём специалиста", amount: 560 },
  { title: "Сломался рабочий ноутбук", amount: 760 },
  { title: "Штраф за забытый документ", amount: 260 },
  { title: "Внезапная поездка домой", amount: 420 }
];

const MARKET_CARDS = [
  { kind: "cash", title: "Городской грант", amount: 560, text: "Вашу инициативу заметили и компенсировали часть затрат." },
  { kind: "cash", title: "Сезонный всплеск", amount: 420, text: "Локальный спрос вырос, свободные деньги прибавились." },
  { kind: "cash", title: "Просадка спроса", amount: -420, text: "Неделя вышла слабой, пришлось покрыть разрыв." },
  { kind: "cash", title: "Возврат переплаты", amount: 430, text: "Бухгалтерия нашла ошибку в вашу пользу." },
  { kind: "asset-sale", title: "Охотник за нишами", multiplier: 1.18, text: "Покупатель ищет именно такой актив." },
  { kind: "asset-sale", title: "Быстрая ликвидность", multiplier: 0.88, text: "Можно выйти из актива быстро, но с дисконтом." }
];

const PROJECT_DEALS = [
  {
    id: "smart-lockers",
    title: "Сеть умных шкафчиков",
    text: "Пункты выдачи для локальных мастеров и онлайн-продавцов.",
    cost: 4200,
    marketValue: 5200,
    upkeep: 170,
    passiveIncome: 850
  },
  {
    id: "popup-kitchen",
    title: "Кухня для pop-up команд",
    text: "Почасовая аренда кухни для маленьких гастро-проектов.",
    cost: 6200,
    marketValue: 7800,
    upkeep: 260,
    passiveIncome: 1250
  },
  {
    id: "maker-ledger",
    title: "Сервис учёта для мастеров",
    text: "Подписка для самозанятых: заявки, склад, напоминания клиентам.",
    cost: 7600,
    marketValue: 9800,
    upkeep: 320,
    passiveIncome: 1550
  },
  {
    id: "skill-festival",
    title: "Фестиваль полезных навыков",
    text: "Ежемесячная площадка с билетами, партнёрами и маркетом.",
    cost: 9800,
    marketValue: 12400,
    upkeep: 470,
    passiveIncome: 2100
  }
];

const PROJECT_MARKET_CARDS = [
  { title: "Партнёрская витрина", multiplier: 1.22, text: "Покупатель готов заплатить за проект с работающей аудиторией." },
  { title: "Смена формата", multiplier: 0.92, text: "Проект можно продать быстро, но рынок просит скидку за переупаковку." },
  { title: "Раунд роста", multiplier: 1.35, text: "Стратегический партнёр хочет купить проект как готовую точку роста." }
];

function createPlayer(id, name, professionId, accountId = null) {
  const profession = findProfession(professionId);
  return {
    id,
    accountId,
    name: String(name || "Игрок").slice(0, 24),
    professionId: profession.id,
    profession: profession.title,
    track: "money-yard",
    position: 0,
    projectPosition: 0,
    grandGoal: { ...pick(GRAND_GOALS) },
    cash: profession.cash,
    salary: profession.salary,
    expenses: profession.expenses,
    passiveIncome: 0,
    projectIncome: 0,
    reputation: 0,
    assets: [],
    liabilities: profession.liabilities.map((item) => ({ ...item, id: makeId() })),
    skippedTurns: 0,
    lastRoll: null,
    ready: false
  };
}

function createGame(roomCode, hostName, professionId, hostAccountId = null) {
  const host = createPlayer(makeId(), hostName || "Хост", professionId, hostAccountId);
  return {
    roomCode,
    status: "lobby",
    hostId: host.id,
    players: [host],
    currentPlayerIndex: 0,
    winnerId: null,
    log: [`Комната ${roomCode} создана.`],
    chat: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function addPlayer(game, name, professionId, accountId = null) {
  if (game.status !== "lobby") {
    throw new Error("Игра уже началась.");
  }
  if (game.players.length >= 4) {
    throw new Error("В MVP максимум 4 игрока.");
  }
  if (accountId && game.players.some((item) => item.accountId === accountId)) {
    throw new Error("Этот аккаунт уже в комнате.");
  }
  const player = createPlayer(makeId(), name || `Игрок ${game.players.length + 1}`, professionId, accountId);
  game.players.push(player);
  game.log.unshift(`${player.name} присоединился к комнате.`);
  touch(game);
  return player;
}

function setPlayerReady(game, playerId, ready = true) {
  if (game.status !== "lobby") {
    throw new Error("Готовность можно менять только в лобби.");
  }
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Игрок не найден.");
  }
  player.ready = Boolean(ready);
  game.log.unshift(`${player.name} ${player.ready ? "готов" : "снял готовность"}.`);
  touch(game);
}

function startGame(game, hostId) {
  assertHost(game, hostId);
  if (game.players.length < 1) {
    throw new Error("Нужен хотя бы один игрок.");
  }
  const notReady = game.players.filter((player) => player.id !== game.hostId && !player.ready);
  if (notReady.length > 0) {
    throw new Error("Не все игроки готовы.");
  }
  game.status = "playing";
  game.players.forEach((player) => {
    player.ready = false;
  });
  game.log.unshift("Игра началась.");
  touch(game);
}

function restartGame(game, hostId) {
  assertHost(game, hostId);
  const previousWinner = game.players.find((player) => player.id === game.winnerId);
  const players = game.players.map((player) => resetPlayerForNewGame(player));
  game.status = "lobby";
  game.players = players;
  game.currentPlayerIndex = 0;
  game.winnerId = null;
  game.log.unshift(previousWinner ? `Новая партия создана. Прошлый победитель: ${previousWinner.name}.` : "Новая партия создана.");
  touch(game);
}

function kickPlayer(game, hostId, playerId) {
  assertHost(game, hostId);
  if (game.status !== "lobby") {
    throw new Error("Кикать игроков можно только в лобби.");
  }
  if (playerId === game.hostId) {
    throw new Error("Хоста нельзя кикнуть из собственной комнаты.");
  }
  const index = game.players.findIndex((player) => player.id === playerId);
  if (index < 0) {
    throw new Error("Игрок не найден.");
  }
  const [player] = game.players.splice(index, 1);
  if (game.currentPlayerIndex >= game.players.length) {
    game.currentPlayerIndex = 0;
  }
  game.log.unshift(`${player.name} удалён из комнаты.`);
  touch(game);
}

function takeTurn(game, playerId) {
  if (game.status !== "playing") {
    throw new Error("Игра ещё не началась.");
  }
  const player = currentPlayer(game);
  if (!player || player.id !== playerId) {
    throw new Error("Сейчас ход другого игрока.");
  }

  if (player.skippedTurns > 0) {
    player.skippedTurns -= 1;
    player.lastRoll = 0;
    game.log.unshift(`${player.name} пропускает ход после сокращения.`);
    advanceTurn(game);
    touch(game);
    return { kind: "skip", player };
  }

  const roll = rollDie();
  player.lastRoll = roll;
  const event = player.track === "project-league"
    ? takeProjectTurn(game, player, roll)
    : takeMoneyYardTurn(game, player, roll);

  if (!game.winnerId && !hasPendingDecision(player)) {
    advanceTurn(game);
  }
  touch(game);
  return event;
}

function takeMoneyYardTurn(game, player, roll) {
  player.position = (player.position + roll) % BOARD_SIZE;
  const cell = CELLS[player.position];
  const event = resolveCell(game, player, cell, roll);
  checkProgress(game, player);
  return event;
}

function takeProjectTurn(game, player, roll) {
  player.projectPosition = (player.projectPosition + roll) % PROJECT_BOARD_SIZE;
  const cell = PROJECT_CELLS[player.projectPosition];
  return resolveProjectCell(game, player, cell, roll);
}

function drawOpportunity(game, playerId, type) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingOpportunityChoice) {
    throw new Error("Нет выбора сделки.");
  }
  if (type !== "small" && type !== "large") {
    throw new Error("Выбери малую или крупную сделку.");
  }

  const card = pick(OPPORTUNITY_CARDS.filter((item) => item.type === type));
  player.pendingOpportunity = { ...card };
  delete player.pendingOpportunityChoice;
  game.log.unshift(`${player.name} выбирает ${type === "large" ? "крупную" : "малую"} сделку: "${card.title}".`);
  touch(game);
  return card;
}

function buyOpportunity(game, playerId, mode = "cash") {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingOpportunity) {
    throw new Error("Нет доступной сделки.");
  }
  const card = player.pendingOpportunity;
  const financed = mode === "finance" && card.loan > 0;
  const cashRequired = financed ? card.downPayment : card.cost;
  if (player.cash < cashRequired) {
    throw new Error("Недостаточно денег для сделки.");
  }
  player.cash -= cashRequired;
  player.passiveIncome += card.passiveIncome;
  const assetId = makeId();
  player.assets.push({
    id: assetId,
    title: card.title,
    type: card.type,
    cost: card.cost,
    downPayment: cashRequired,
    loan: financed ? card.loan : 0,
    payment: financed ? card.payment : 0,
    marketValue: card.marketValue,
    passiveIncome: card.passiveIncome
  });
  if (financed) {
    player.expenses += card.payment;
    player.liabilities.push({
      id: assetId,
      title: `Кредит: ${card.title}`,
      payment: card.payment,
      balance: card.loan
    });
  }
  delete player.pendingOpportunity;
  player.reputation += card.type === "large" ? 2 : 1;
  const details = financed ? `с кредитом, взнос ${money(cashRequired)}` : `за ${money(card.cost)}`;
  game.log.unshift(`${player.name} покупает "${card.title}" ${details} и повышает репутацию.`);
  checkProgress(game, player);
  if (!game.winnerId && currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function repayLiability(game, playerId, liabilityId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Игрок не найден.");
  }
  const liabilityIndex = player.liabilities.findIndex((item) => item.id === liabilityId);
  if (liabilityIndex < 0) {
    throw new Error("Обязательство не найдено.");
  }
  const liability = player.liabilities[liabilityIndex];
  if (player.cash < liability.balance) {
    throw new Error("Недостаточно денег для закрытия долга.");
  }
  player.cash -= liability.balance;
  player.expenses = Math.max(0, player.expenses - liability.payment);
  player.liabilities.splice(liabilityIndex, 1);
  const asset = player.assets.find((item) => item.id === liabilityId);
  if (asset) {
    asset.loan = 0;
    asset.payment = 0;
  }
  game.log.unshift(`${player.name} закрывает "${liability.title}" за ${money(liability.balance)}.`);
  checkProgress(game, player);
  touch(game);
}

function buyGrandGoal(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Игрок не найден.");
  }
  if (player.track !== "project-league") {
    throw new Error("Большая цель доступна в Лиге проектов.");
  }
  if (player.cash < player.grandGoal.cost) {
    throw new Error("Недостаточно денег для большой цели.");
  }

  player.cash -= player.grandGoal.cost;
  game.status = "finished";
  game.winnerId = player.id;
  game.log.unshift(`${player.name} закрывает большую цель "${player.grandGoal.title}" и выигрывает игру.`);
  touch(game);
}

function buyProjectDeal(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingProjectDeal) {
    throw new Error("Нет проектной возможности.");
  }
  if (player.track !== "project-league") {
    throw new Error("Проекты доступны только в Лиге проектов.");
  }

  const deal = player.pendingProjectDeal;
  if (player.cash < deal.cost) {
    throw new Error("Недостаточно денег для проекта.");
  }

  player.cash -= deal.cost;
  player.passiveIncome += deal.passiveIncome;
  player.projectIncome += deal.passiveIncome;
  player.expenses += deal.upkeep || 0;
  player.reputation += 2;
  player.assets.push({
    id: makeId(),
    title: deal.title,
    type: "project-league",
    cost: deal.cost,
    downPayment: deal.cost,
    loan: 0,
    payment: deal.upkeep || 0,
    marketValue: deal.marketValue,
    passiveIncome: deal.passiveIncome
  });
  delete player.pendingProjectDeal;
  const upkeep = deal.upkeep ? `, обслуживание ${money(deal.upkeep)}/мес` : "";
  game.log.unshift(`${player.name} вкладывается в проект "${deal.title}" за ${money(deal.cost)}${upkeep}.`);
  checkProgress(game, player);
  if (!game.winnerId && currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function passProjectDeal(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingProjectDeal) {
    throw new Error("Нет проектной возможности для пропуска.");
  }

  game.log.unshift(`${player.name} пропускает проект "${player.pendingProjectDeal.title}".`);
  delete player.pendingProjectDeal;
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function acceptMarketOffer(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingMarketOffer) {
    throw new Error("Нет рыночного предложения.");
  }
  const offer = player.pendingMarketOffer;
  const assetIndex = player.assets.findIndex((item) => item.id === offer.assetId);
  if (assetIndex < 0) {
    delete player.pendingMarketOffer;
    throw new Error("Актив уже недоступен.");
  }
  const asset = player.assets[assetIndex];
  const liabilityIndex = player.liabilities.findIndex((item) => item.id === asset.id);
  const debt = liabilityIndex >= 0 ? player.liabilities[liabilityIndex].balance : 0;
  const payment = liabilityIndex >= 0 ? player.liabilities[liabilityIndex].payment : 0;
  const proceeds = offer.price - debt;
  player.cash += proceeds;
  player.passiveIncome = Math.max(0, player.passiveIncome - asset.passiveIncome);
  if (asset.type === "project-league") {
    player.projectIncome = Math.max(0, player.projectIncome - asset.passiveIncome);
  }
  player.expenses = Math.max(0, player.expenses - payment);
  player.assets.splice(assetIndex, 1);
  if (liabilityIndex >= 0) {
    player.liabilities.splice(liabilityIndex, 1);
  }
  delete player.pendingMarketOffer;
  game.log.unshift(`${player.name} продаёт "${asset.title}" за ${money(offer.price)}. Чистый результат: ${money(proceeds)}.`);
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function declineMarketOffer(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingMarketOffer) {
    throw new Error("Нет рыночного предложения.");
  }
  game.log.unshift(`${player.name} отклоняет предложение по "${player.pendingMarketOffer.assetTitle}".`);
  delete player.pendingMarketOffer;
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function addChatMessage(game, playerId, text) {
  const player = game.players.find((item) => item.id === playerId);
  const message = String(text || "").trim().slice(0, 300);
  if (!player) {
    throw new Error("Игрок не найден.");
  }
  if (!message) {
    throw new Error("Сообщение пустое.");
  }
  game.chat.push({
    id: makeId(),
    playerId,
    playerName: player.name,
    text: message,
    createdAt: Date.now()
  });
  game.chat = game.chat.slice(-80);
  touch(game);
}

function passOpportunity(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingOpportunity) {
    throw new Error("Нет сделки для пропуска.");
  }
  game.log.unshift(`${player.name} пропускает "${player.pendingOpportunity.title}".`);
  delete player.pendingOpportunity;
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function passOpportunityChoice(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingOpportunityChoice) {
    throw new Error("Нет выбора сделки для пропуска.");
  }
  game.log.unshift(`${player.name} пропускает возможность.`);
  delete player.pendingOpportunityChoice;
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
}

function resolveCell(game, player, cell, roll) {
  let message = `${player.name} выбрасывает ${roll} и попадает на "${cell.label}".`;

  if (cell.type === "payday") {
    const income = monthlySurplus(player);
    player.cash += income;
    message += ` Свободный остаток: ${money(income)}.`;
  }

  if (cell.type === "opportunity") {
    player.pendingOpportunityChoice = true;
    message += " Игрок выбирает малую или крупную сделку.";
  }

  if (cell.type === "expense") {
    const card = pick(EXPENSE_CARDS);
    player.cash -= card.amount;
    message += ` ${card.title}: -${money(card.amount)}.`;
  }

  if (cell.type === "market") {
    const card = pick(MARKET_CARDS);
    if (card.kind === "asset-sale" && player.assets.length > 0) {
      const asset = pick(player.assets);
      const price = Math.round(asset.marketValue * card.multiplier);
      player.pendingMarketOffer = {
        assetId: asset.id,
        assetTitle: asset.title,
        title: card.title,
        price,
        text: card.text
      };
      message += ` ${card.title}: предложение продать "${asset.title}" за ${money(price)}.`;
    } else {
      player.cash += card.amount;
      const signed = card.amount >= 0 ? `+${money(card.amount)}` : `-${money(Math.abs(card.amount))}`;
      message += ` ${card.title}: ${signed}.`;
    }
  }

  if (cell.type === "charity") {
    const donation = Math.min(300, Math.max(0, player.cash));
    player.cash -= donation;
    player.passiveIncome += 40;
    player.reputation += 1;
    message += ` Пожертвование ${money(donation)} повышает доход на ${money(40)} и репутацию.`;
  }

  if (cell.type === "downsized") {
    const loss = Math.max(0, monthlySurplus(player));
    player.cash -= loss;
    player.skippedTurns = 1;
    message += ` Сокращение: потеря ${money(loss)} и пропуск следующего хода.`;
  }

  game.log.unshift(message);
  return { kind: cell.type, player, cell, message };
}

function resolveProjectCell(game, player, cell, roll) {
  let message = `${player.name} выбрасывает ${roll} в Лиге проектов и попадает на "${cell.label}".`;

  if (cell.type === "money-day") {
    const income = Math.max(monthlySurplus(player), projectNetIncome(player), 0);
    player.cash += income;
    message += ` Получен денежный поток: ${money(income)}.`;
  }

  if (cell.type === "fast-deal") {
    const deal = pick(PROJECT_DEALS);
    player.pendingProjectDeal = { ...deal };
    message += ` Проект: "${deal.title}", вход ${money(deal.cost)}, доход +${money(deal.passiveIncome)}, обслуживание ${money(deal.upkeep || 0)}.`;
  }

  if (cell.type === "goal") {
    if (player.cash >= player.grandGoal.cost) {
      player.cash -= player.grandGoal.cost;
      game.status = "finished";
      game.winnerId = player.id;
      message += ` ${player.name} закрывает большую цель "${player.grandGoal.title}" за ${money(player.grandGoal.cost)} и выигрывает.`;
    } else {
      message += ` Большая цель "${player.grandGoal.title}" стоит ${money(player.grandGoal.cost)}. Нужно накопить ещё ${money(player.grandGoal.cost - player.cash)}.`;
    }
  }

  if (cell.type === "charity") {
    const donation = Math.min(500, Math.max(0, player.cash));
    player.cash -= donation;
    player.passiveIncome += 100;
    player.projectIncome += 100;
    player.reputation += 1;
    message += ` Пожертвование ${money(donation)} повышает поток на ${money(100)} и репутацию.`;
  }

  if (cell.type === "tax-audit") {
    const taxBase = 700 + projectAssetCount(player) * 180 + Math.round(player.projectIncome * 0.08);
    const tax = Math.min(taxBase, Math.max(0, player.cash));
    player.cash -= tax;
    message += ` Налоговая проверка: -${money(tax)}.`;
  }

  if (cell.type === "market") {
    const projectAssets = player.assets.filter((asset) => asset.type === "project-league");
    if (projectAssets.length > 0) {
      const asset = pick(projectAssets);
      const card = pick(PROJECT_MARKET_CARDS);
      const price = Math.round(asset.marketValue * card.multiplier);
      player.pendingMarketOffer = {
        assetId: asset.id,
        assetTitle: asset.title,
        title: card.title,
        price,
        text: card.text
      };
      message += ` ${card.title}: предложение продать "${asset.title}" за ${money(price)}.`;
    } else {
      const gain = 1200;
      player.cash += gain;
      message += ` Удачная рыночная сделка без портфеля: +${money(gain)}.`;
    }
  }

  game.log.unshift(message);
  checkProgress(game, player);
  return { kind: `fast-${cell.type}`, player, cell, message };
}

function currentPlayer(game) {
  return game.players[game.currentPlayerIndex] || null;
}

function hasPendingDecision(player) {
  return Boolean(player.pendingOpportunity || player.pendingOpportunityChoice || player.pendingMarketOffer || player.pendingProjectDeal);
}

function advanceTurn(game) {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
}

function checkProgress(game, player) {
  if (game.status === "finished") {
    return;
  }

  if (player.track === "money-yard" && canEnterProjectLeague(player)) {
    enterProjectLeague(game, player);
    return;
  }

  if (player.track === "project-league" && hasWinningProjectPortfolio(player)) {
    game.status = "finished";
    game.winnerId = player.id;
    game.log.unshift(`${player.name} выигрывает: портфель проектов стал устойчивым.`);
  }
}

function canEnterProjectLeague(player) {
  return player.reputation >= REPUTATION_GOAL && player.cash >= player.expenses * RESERVE_MONTHS_GOAL;
}

function projectAssetCount(player) {
  return player.assets.filter((asset) => asset.type === "project-league").length;
}

function projectMaintenanceCost(player) {
  return player.assets
    .filter((asset) => asset.type === "project-league")
    .reduce((sum, asset) => sum + (asset.payment || 0), 0);
}

function projectNetIncome(player) {
  return Math.max(0, player.projectIncome - projectMaintenanceCost(player));
}

function hasWinningProjectPortfolio(player) {
  return player.projectIncome >= PROJECT_INCOME_GOAL && projectAssetCount(player) >= PROJECT_PORTFOLIO_GOAL;
}

function enterProjectLeague(game, player) {
  player.track = "project-league";
  player.projectPosition = 0;
  delete player.pendingOpportunity;
  delete player.pendingOpportunityChoice;
  delete player.pendingMarketOffer;
  delete player.pendingProjectDeal;
  game.log.unshift(`${player.name} переходит в Лигу проектов. Большая цель: "${player.grandGoal.title}".`);
}

function serializeGame(game) {
  if (!game.hostId && game.players[0]) {
    game.hostId = game.players[0].id;
  }
  return {
    ...game,
    currentPlayerId: currentPlayer(game)?.id || null,
    chat: game.chat.slice(-80),
    professions: PROFESSIONS.map((profession) => ({
      id: profession.id,
      title: profession.title,
      salary: profession.salary,
      expenses: profession.expenses,
      cash: profession.cash
    })),
    players: game.players.map((player) => ({
      ...player,
      totalIncome: totalIncome(player),
      monthlySurplus: monthlySurplus(player),
      projectReadiness: projectReadiness(player),
      projectAssetCount: projectAssetCount(player),
      projectMaintenanceCost: projectMaintenanceCost(player),
      projectNetIncome: projectNetIncome(player),
      totalLiabilityPayment: totalLiabilityPayment(player),
      liabilityBalance: liabilityBalance(player)
    }))
  };
}

function resetPlayerForNewGame(player) {
  const fresh = createPlayer(player.id, player.name, player.professionId, player.accountId || null);
  fresh.ready = false;
  return fresh;
}

function assertHost(game, playerId) {
  if (!game.hostId && game.players[0]) {
    game.hostId = game.players[0].id;
  }
  if (!playerId || playerId !== game.hostId) {
    throw new Error("Это действие доступно только хосту.");
  }
}

function serializeRules() {
  return {
    boardSize: BOARD_SIZE,
    cells: CELLS.map((cell) => ({ ...cell })),
    projectCells: PROJECT_CELLS.map((cell) => ({ ...cell })),
    projectIncomeGoal: PROJECT_INCOME_GOAL,
    projectPortfolioGoal: PROJECT_PORTFOLIO_GOAL,
    reputationGoal: REPUTATION_GOAL,
    reserveMonthsGoal: RESERVE_MONTHS_GOAL,
    grandGoals: GRAND_GOALS.map((goal) => ({ ...goal })),
    professions: PROFESSIONS.map((profession) => ({
      id: profession.id,
      title: profession.title,
      salary: profession.salary,
      expenses: profession.expenses,
      cash: profession.cash,
      liabilities: profession.liabilities.map((liability) => ({ ...liability }))
    }))
  };
}

function findProfession(professionId) {
  return PROFESSIONS.find((profession) => profession.id === professionId) || pick(PROFESSIONS);
}

function totalIncome(player) {
  return player.salary + player.passiveIncome;
}

function totalLiabilityPayment(player) {
  return player.liabilities.reduce((sum, liability) => sum + liability.payment, 0);
}

function liabilityBalance(player) {
  return player.liabilities.reduce((sum, liability) => sum + liability.balance, 0);
}

function monthlySurplus(player) {
  return totalIncome(player) - player.expenses;
}

function projectReadiness(player) {
  const reserveRequired = player.expenses * RESERVE_MONTHS_GOAL;
  return {
    reputation: player.reputation,
    reputationRequired: REPUTATION_GOAL,
    reserve: player.cash,
    reserveRequired,
    ready: player.track === "project-league" || canEnterProjectLeague(player)
  };
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function money(value) {
  return `$${value}`;
}

function touch(game) {
  game.updatedAt = Date.now();
}

module.exports = {
  CELLS,
  PROFESSIONS,
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
};
