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
    title: "Дивидендные акции",
    text: "Покупка пакета акций приносит небольшой пассивный доход.",
    cost: 800,
    passiveIncome: 120
  },
  {
    id: "garage-rent",
    title: "Гараж в аренду",
    text: "Недорогой объект с устойчивым арендным потоком.",
    cost: 1200,
    passiveIncome: 220
  },
  {
    id: "online-course",
    title: "Онлайн-курс",
    text: "Разовый запуск цифрового продукта.",
    cost: 600,
    passiveIncome: 90
  },
  {
    id: "small-business",
    title: "Малый бизнес",
    text: "Больше риска и выше регулярный денежный поток.",
    cost: 2200,
    passiveIncome: 430
  },
  {
    id: "apartment",
    title: "Квартира под сдачу",
    text: "Крупная сделка с хорошим ежемесячным доходом.",
    cost: 3500,
    passiveIncome: 760
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
  { title: "Бонус на рынке", amount: 650, text: "Удачная продажа старого актива." },
  { title: "Рост портфеля", amount: 400, text: "Инвестиции подорожали, часть прибыли зафиксирована." },
  { title: "Падение рынка", amount: -350, text: "Часть свободных денег ушла на покрытие просадки." },
  { title: "Налоговый возврат", amount: 500, text: "Государство неожиданно вернуло переплату." }
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
    liabilities: profession.liabilities.map((item) => ({ ...item })),
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

  if (!game.winnerId && !player.pendingOpportunity) {
    advanceTurn(game);
  }
  touch(game);
  return event;
}

function buyOpportunity(game, playerId) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingOpportunity) {
    throw new Error("Нет доступной сделки.");
  }
  const card = player.pendingOpportunity;
  if (player.cash < card.cost) {
    throw new Error("Недостаточно денег для сделки.");
  }
  player.cash -= card.cost;
  player.passiveIncome += card.passiveIncome;
  player.assets.push({
    title: card.title,
    cost: card.cost,
    passiveIncome: card.passiveIncome
  });
  delete player.pendingOpportunity;
  game.log.unshift(`${player.name} покупает "${card.title}" за ${money(card.cost)}.`);
  checkWinner(game, player);
  if (!game.winnerId && currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
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

function resolveCell(game, player, cell, roll) {
  let message = `${player.name} выбрасывает ${roll} и попадает на "${cell.label}".`;

  if (cell.type === "payday") {
    const income = monthlyCashflow(player);
    player.cash += income;
    message += ` Денежный поток: ${money(income)}.`;
  }

  if (cell.type === "opportunity") {
    const card = pick(OPPORTUNITY_CARDS);
    player.pendingOpportunity = { ...card };
    message += ` Сделка: ${card.title}, цена ${money(card.cost)}, пассивный доход ${money(card.passiveIncome)}.`;
  }

  if (cell.type === "expense") {
    const card = pick(EXPENSE_CARDS);
    player.cash -= card.amount;
    message += ` ${card.title}: -${money(card.amount)}.`;
  }

  if (cell.type === "market") {
    const card = pick(MARKET_CARDS);
    player.cash += card.amount;
    const signed = card.amount >= 0 ? `+${money(card.amount)}` : `-${money(Math.abs(card.amount))}`;
    message += ` ${card.title}: ${signed}.`;
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
  buyOpportunity,
  passOpportunity,
  serializeGame,
  makeRoomCode
};
