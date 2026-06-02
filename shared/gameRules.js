const BOARD_SIZE = 18;

const PROFESSIONS = [
  {
    id: "engineer",
    title: "Инженер",
    salary: 4200,
    expenses: 2600,
    cash: 1800,
    liabilities: [
      { title: "Ипотека", payment: 900, balance: 82000 },
      { title: "Автокредит", payment: 320, balance: 12000 }
    ]
  },
  {
    id: "teacher",
    title: "Учитель",
    salary: 2600,
    expenses: 1700,
    cash: 900,
    liabilities: [
      { title: "Потребительский кредит", payment: 180, balance: 4200 }
    ]
  },
  {
    id: "doctor",
    title: "Врач",
    salary: 5200,
    expenses: 3600,
    cash: 2200,
    liabilities: [
      { title: "Ипотека", payment: 1200, balance: 110000 },
      { title: "Образовательный кредит", payment: 420, balance: 26000 }
    ]
  },
  {
    id: "driver",
    title: "Водитель",
    salary: 3100,
    expenses: 2100,
    cash: 1300,
    liabilities: [
      { title: "Автокредит", payment: 450, balance: 16000 }
    ]
  },
  {
    id: "designer",
    title: "Дизайнер",
    salary: 3600,
    expenses: 2400,
    cash: 1600,
    liabilities: [
      { title: "Кредитная карта", payment: 220, balance: 5400 }
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

const OPPORTUNITY_CARDS = [
  {
    id: "dividend-stock",
    type: "small",
    title: "Дивидендные акции",
    text: "Покупка пакета акций приносит небольшой пассивный доход.",
    cost: 800,
    downPayment: 800,
    loan: 0,
    payment: 0,
    marketValue: 950,
    passiveIncome: 120
  },
  {
    id: "garage-rent",
    type: "small",
    title: "Гараж в аренду",
    text: "Недорогой объект с устойчивым арендным потоком.",
    cost: 1200,
    downPayment: 500,
    loan: 700,
    payment: 60,
    marketValue: 1500,
    passiveIncome: 220
  },
  {
    id: "online-course",
    type: "small",
    title: "Онлайн-курс",
    text: "Разовый запуск цифрового продукта.",
    cost: 600,
    downPayment: 600,
    loan: 0,
    payment: 0,
    marketValue: 700,
    passiveIncome: 90
  },
  {
    id: "small-business",
    type: "large",
    title: "Малый бизнес",
    text: "Больше риска и выше регулярный денежный поток.",
    cost: 2200,
    downPayment: 900,
    loan: 1300,
    payment: 140,
    marketValue: 3100,
    passiveIncome: 430
  },
  {
    id: "apartment",
    type: "large",
    title: "Квартира под сдачу",
    text: "Крупная сделка с хорошим ежемесячным доходом.",
    cost: 3500,
    downPayment: 1200,
    loan: 2300,
    payment: 230,
    marketValue: 4600,
    passiveIncome: 760
  },
  {
    id: "car-wash",
    type: "large",
    title: "Автомойка",
    text: "Операционный бизнес с кредитным плечом.",
    cost: 5000,
    downPayment: 1600,
    loan: 3400,
    payment: 360,
    marketValue: 6400,
    passiveIncome: 1050
  }
];

const EXPENSE_CARDS = [
  { title: "Ремонт машины", amount: 450 },
  { title: "Семейный праздник", amount: 300 },
  { title: "Медицинский счёт", amount: 550 },
  { title: "Обновление техники", amount: 700 },
  { title: "Неожиданный штраф", amount: 250 }
];

const MARKET_CARDS = [
  { kind: "cash", title: "Бонус на рынке", amount: 650, text: "Удачная продажа старого актива." },
  { kind: "cash", title: "Рост портфеля", amount: 400, text: "Инвестиции подорожали, часть прибыли зафиксирована." },
  { kind: "cash", title: "Падение рынка", amount: -350, text: "Часть свободных денег ушла на покрытие просадки." },
  { kind: "cash", title: "Налоговый возврат", amount: 500, text: "Государство неожиданно вернуло переплату." },
  { kind: "asset-sale", title: "Покупатель на актив", multiplier: 1.25, text: "На рынке появился покупатель с премией." },
  { kind: "asset-sale", title: "Срочный выкуп", multiplier: 0.9, text: "Можно продать актив быстро, но дешевле рынка." }
];

function createPlayer(id, name, professionId) {
  const profession = findProfession(professionId);
  return {
    id,
    name: String(name || "Игрок").slice(0, 24),
    professionId: profession.id,
    profession: profession.title,
    position: 0,
    cash: profession.cash,
    salary: profession.salary,
    expenses: profession.expenses,
    passiveIncome: 0,
    assets: [],
    liabilities: profession.liabilities.map((item) => ({ ...item, id: makeId() })),
    skippedTurns: 0,
    lastRoll: null
  };
}

function createGame(roomCode, hostName, professionId) {
  const host = createPlayer(makeId(), hostName || "Хост", professionId);
  return {
    roomCode,
    status: "lobby",
    players: [host],
    currentPlayerIndex: 0,
    winnerId: null,
    log: [`Комната ${roomCode} создана.`],
    chat: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function addPlayer(game, name, professionId) {
  if (game.status !== "lobby") {
    throw new Error("Игра уже началась.");
  }
  if (game.players.length >= 4) {
    throw new Error("В MVP максимум 4 игрока.");
  }
  const player = createPlayer(makeId(), name || `Игрок ${game.players.length + 1}`, professionId);
  game.players.push(player);
  game.log.unshift(`${player.name} присоединился к комнате.`);
  touch(game);
  return player;
}

function startGame(game) {
  if (game.players.length < 1) {
    throw new Error("Нужен хотя бы один игрок.");
  }
  game.status = "playing";
  game.log.unshift("Игра началась.");
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
  player.position = (player.position + roll) % BOARD_SIZE;
  const cell = CELLS[player.position];
  const event = resolveCell(game, player, cell, roll);
  checkWinner(game, player);

  if (!game.winnerId && !hasPendingDecision(player)) {
    advanceTurn(game);
  }
  touch(game);
  return event;
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
  const details = financed ? `с кредитом, взнос ${money(cashRequired)}` : `за ${money(card.cost)}`;
  game.log.unshift(`${player.name} покупает "${card.title}" ${details}.`);
  checkWinner(game, player);
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
  checkWinner(game, player);
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
    const income = monthlyCashflow(player);
    player.cash += income;
    message += ` Денежный поток: ${money(income)}.`;
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
    message += ` Пожертвование ${money(donation)} повышает репутационный доход на ${money(40)}.`;
  }

  if (cell.type === "downsized") {
    const loss = Math.max(0, monthlyCashflow(player));
    player.cash -= loss;
    player.skippedTurns = 1;
    message += ` Сокращение: потеря ${money(loss)} и пропуск следующего хода.`;
  }

  game.log.unshift(message);
  return { kind: cell.type, player, cell, message };
}

function currentPlayer(game) {
  return game.players[game.currentPlayerIndex] || null;
}

function hasPendingDecision(player) {
  return Boolean(player.pendingOpportunity || player.pendingOpportunityChoice || player.pendingMarketOffer);
}

function advanceTurn(game) {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
}

function checkWinner(game, player) {
  if (player.passiveIncome >= player.expenses) {
    game.status = "finished";
    game.winnerId = player.id;
    game.log.unshift(`${player.name} выходит из крысиных бегов: пассивный доход покрывает расходы.`);
  }
}

function serializeGame(game) {
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
      monthlyCashflow: monthlyCashflow(player),
      totalLiabilityPayment: totalLiabilityPayment(player),
      liabilityBalance: liabilityBalance(player)
    }))
  };
}

function serializeRules() {
  return {
    boardSize: BOARD_SIZE,
    cells: CELLS.map((cell) => ({ ...cell })),
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

function monthlyCashflow(player) {
  return totalIncome(player) - player.expenses;
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
  startGame,
  takeTurn,
  drawOpportunity,
  buyOpportunity,
  passOpportunity,
  passOpportunityChoice,
  repayLiability,
  acceptMarketOffer,
  declineMarketOffer,
  addChatMessage,
  serializeGame,
  serializeRules,
  makeRoomCode
};
