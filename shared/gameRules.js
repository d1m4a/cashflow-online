const BOARD_SIZE = 18;
const PROJECT_BOARD_SIZE = 12;
const PROJECT_INCOME_GOAL = 6200;
const PROJECT_PORTFOLIO_GOAL = 3;
const REPUTATION_GOAL = 5;
const RESERVE_MONTHS_GOAL = 2;
const GAME_LENGTHS = {
  quick: { title: "Быстрая", maxTurns: 36 },
  standard: { title: "Стандартная", maxTurns: 72 },
  open: { title: "Без лимита", maxTurns: null }
};
const VICTORY_MODES = {
  classic: { title: "Классика" },
  goal: { title: "Большая цель" },
  portfolio: { title: "Портфель проектов" },
  netWorth: { title: "Капитал к лимиту ходов" }
};

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
    cash: 2400,
    liabilities: [
      { title: "Семейный заём", payment: 300, balance: 7600 },
      { title: "Рассрочка на ноутбук", payment: 180, balance: 3900 }
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
    cash: 1400,
    liabilities: [
      { title: "Карта с лимитом", payment: 260, balance: 7200 }
    ]
  },
  {
    id: "clinic-admin",
    title: "Администратор клиники",
    salary: 4200,
    expenses: 2940,
    cash: 2200,
    liabilities: [
      { title: "Кредит на ремонт", payment: 250, balance: 6100 },
      { title: "Потребительский долг", payment: 160, balance: 3300 }
    ]
  },
  {
    id: "junior-developer",
    title: "Младший разработчик",
    salary: 5200,
    expenses: 3820,
    cash: 3000,
    liabilities: [
      { title: "Рассрочка на технику", payment: 210, balance: 4800 },
      { title: "Образовательный кредит", payment: 260, balance: 6800 }
    ]
  },
  {
    id: "cafe-manager",
    title: "Управляющий кафе",
    salary: 4650,
    expenses: 3360,
    cash: 2600,
    liabilities: [
      { title: "Автокредит", payment: 310, balance: 9800 }
    ]
  },
  {
    id: "design-freelancer",
    title: "Дизайнер-фрилансер",
    salary: 4100,
    expenses: 2860,
    cash: 1900,
    liabilities: [
      { title: "Карта за отпуск", payment: 330, balance: 9800 }
    ]
  },
  {
    id: "logistics-analyst",
    title: "Аналитик логистики",
    salary: 5600,
    expenses: 4180,
    cash: 3500,
    liabilities: [
      { title: "Ипотечный платёж", payment: 420, balance: 12200 },
      { title: "Кредитная карта", payment: 150, balance: 3200 }
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
  },
  {
    id: "coffee-cart",
    type: "small",
    title: "Кофейная тележка",
    text: "Утренняя точка у бизнес-центра с предсказуемым потоком.",
    cost: 1650,
    downPayment: 650,
    loan: 1000,
    payment: 95,
    marketValue: 2100,
    passiveIncome: 240
  },
  {
    id: "kids-workshop",
    type: "small",
    title: "Детские мастер-классы",
    text: "Набор материалов и партнёрство с локальной студией выходного дня.",
    cost: 980,
    downPayment: 980,
    loan: 0,
    payment: 0,
    marketValue: 1250,
    passiveIncome: 135
  },
  {
    id: "printer-share",
    type: "small",
    title: "3D-принтер в долю",
    text: "Часть времени станка продаётся мастерам и студентам.",
    cost: 2100,
    downPayment: 900,
    loan: 1200,
    payment: 120,
    marketValue: 2700,
    passiveIncome: 310
  },
  {
    id: "mini-hostel-room",
    type: "large",
    title: "Комната под мини-хостел",
    text: "Долгосрочная аренда и переупаковка под посуточное размещение.",
    cost: 5200,
    downPayment: 1900,
    loan: 3300,
    payment: 360,
    marketValue: 6900,
    passiveIncome: 860
  },
  {
    id: "local-crm",
    type: "large",
    title: "CRM для локальных студий",
    text: "Пакет внедрения и подписка для салонов, секций и школ.",
    cost: 6800,
    downPayment: 2400,
    loan: 4400,
    payment: 480,
    marketValue: 8900,
    passiveIncome: 1180
  },
  {
    id: "parking-contract",
    type: "large",
    title: "Контракт на парковочные места",
    text: "Пул мест у жилого комплекса сдаётся помесячно.",
    cost: 8200,
    downPayment: 3100,
    loan: 5100,
    payment: 540,
    marketValue: 10600,
    passiveIncome: 1450
  },
  {
    id: "vending-route",
    type: "small",
    title: "Маршрут вендинга",
    text: "Три небольших автомата в офисах с регулярной выкладкой.",
    cost: 2400,
    downPayment: 1000,
    loan: 1400,
    payment: 135,
    marketValue: 3150,
    passiveIncome: 360
  },
  {
    id: "photo-booth",
    type: "small",
    title: "Фотобудка на события",
    text: "Комплект оборудования сдаётся на свадьбы, маркеты и корпоративы.",
    cost: 1850,
    downPayment: 850,
    loan: 1000,
    payment: 110,
    marketValue: 2450,
    passiveIncome: 285
  },
  {
    id: "coworking-desks",
    type: "large",
    title: "Мини-коворкинг на 8 мест",
    text: "Субаренда комнаты, рабочие места и абонементы для фрилансеров.",
    cost: 7600,
    downPayment: 2800,
    loan: 4800,
    payment: 510,
    marketValue: 9800,
    passiveIncome: 1320
  }
];

const EXPENSE_CARDS = [
  { title: "Затопило кухню", amount: 460 },
  { title: "Срочный подарок родственнику", amount: 320 },
  { title: "Платный приём специалиста", amount: 560 },
  { title: "Сломался рабочий ноутбук", amount: 760 },
  { title: "Штраф за забытый документ", amount: 260 },
  { title: "Внезапная поездка домой", amount: 420 },
  { title: "Ремонт телефона", amount: 380 },
  { title: "Страховой взнос", amount: 510 },
  { title: "Замена зимней резины", amount: 620 },
  { title: "День рождения ребёнка", amount: 700 },
  { title: "Срочные курсы для работы", amount: 540 },
  { title: "Коммунальный перерасчёт", amount: 450 },
  { title: "Юридическая консультация", amount: 680 },
  { title: "Сломалась бытовая техника", amount: 590 },
  { title: "Франшиза не вернула депозит", amount: 840 }
];

const MARKET_CARDS = [
  { kind: "cash", title: "Городской грант", amount: 560, text: "Вашу инициативу заметили и компенсировали часть затрат." },
  { kind: "cash", title: "Сезонный всплеск", amount: 420, text: "Локальный спрос вырос, свободные деньги прибавились." },
  { kind: "cash", title: "Просадка спроса", amount: -420, text: "Неделя вышла слабой, пришлось покрыть разрыв." },
  { kind: "cash", title: "Возврат переплаты", amount: 430, text: "Бухгалтерия нашла ошибку в вашу пользу." },
  { kind: "cash", title: "Разовый заказ", amount: 680, text: "Старый клиент вернулся с быстрым заказом." },
  { kind: "cash", title: "Падение маржи", amount: -620, text: "Поставщики подняли цены, пришлось закрыть разрыв." },
  { kind: "cash", title: "Компенсация страховки", amount: 780, text: "Часть расходов возмещена страховой." },
  { kind: "cash", title: "Просрочка клиента", amount: -540, text: "Платёж задержался, свободные деньги просели." },
  { kind: "cash", title: "Рефинансирование одобрено", amount: 620, text: "Банк вернул часть комиссии после пересмотра условий." },
  { kind: "cash", title: "Новый поставщик", amount: 360, text: "Удалось снизить закупочную цену в текущем месяце." },
  { kind: "cash", title: "Судебный сбор", amount: -760, text: "Спор с контрагентом потребовал дополнительных расходов." },
  { kind: "asset-sale", title: "Охотник за нишами", multiplier: 1.18, text: "Покупатель ищет именно такой актив." },
  { kind: "asset-sale", title: "Быстрая ликвидность", multiplier: 0.88, text: "Можно выйти из актива быстро, но с дисконтом." },
  { kind: "asset-sale", title: "Пик спроса", multiplier: 1.32, text: "Рынок горячий, актив можно продать дороже." },
  { kind: "asset-sale", title: "Слабый квартал", multiplier: 0.76, text: "Покупатели давят цену, но сделка доступна сейчас." }
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
  },
  {
    id: "solar-roofs",
    title: "Солнечные крыши для складов",
    text: "Договор с собственниками складов на экономию энергии и сервис.",
    cost: 8800,
    marketValue: 11200,
    upkeep: 390,
    passiveIncome: 1850
  },
  {
    id: "creator-studio",
    title: "Студия короткого видео",
    text: "Пакетная съёмка для локальных брендов и экспертов.",
    cost: 5400,
    marketValue: 6900,
    upkeep: 240,
    passiveIncome: 1080
  },
  {
    id: "neighborhood-app",
    title: "Приложение района",
    text: "Подписки управляющих компаний, афиша и локальные услуги.",
    cost: 10400,
    marketValue: 13600,
    upkeep: 520,
    passiveIncome: 2350
  },
  {
    id: "repair-franchise",
    title: "Франшиза ремонта техники",
    text: "Точка с готовыми процессами, мастерами и входящими заявками.",
    cost: 7200,
    marketValue: 9300,
    upkeep: 340,
    passiveIncome: 1480
  },
  {
    id: "training-platform",
    title: "Платформа прикладных курсов",
    text: "Записи, кураторы и корпоративные пакеты для малого бизнеса.",
    cost: 8400,
    marketValue: 10900,
    upkeep: 410,
    passiveIncome: 1760
  },
  {
    id: "urban-greenhouse",
    title: "Городская теплица",
    text: "Контракты с кафе на зелень, микрозелень и сезонные наборы.",
    cost: 6600,
    marketValue: 8300,
    upkeep: 300,
    passiveIncome: 1320
  }
];

const PROJECT_MARKET_CARDS = [
  { title: "Партнёрская витрина", multiplier: 1.22, text: "Покупатель готов заплатить за проект с работающей аудиторией." },
  { title: "Смена формата", multiplier: 0.92, text: "Проект можно продать быстро, но рынок просит скидку за переупаковку." },
  { title: "Раунд роста", multiplier: 1.35, text: "Стратегический партнёр хочет купить проект как готовую точку роста." },
  { title: "Конкурент рядом", multiplier: 0.84, text: "Новый игрок снижает оценку проекта." },
  { title: "Корпоративный клиент", multiplier: 1.48, text: "Крупный клиент хочет выкупить работающую систему." }
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

function normalizeRoomSettings(options = {}) {
  const rawTitle = String(options.title || "").trim();
  const rawPrivacy = String(options.privacy || "private").toLowerCase();
  const maxPlayers = Number(options.maxPlayers || 4);
  const gameSettings = normalizeGameSettings(options.gameSettings || options);
  return {
    title: rawTitle.slice(0, 40) || `Комната ${options.roomCode || ""}`.trim(),
    privacy: rawPrivacy === "public" ? "public" : "private",
    maxPlayers: Math.min(4, Math.max(1, Number.isFinite(maxPlayers) ? Math.floor(maxPlayers) : 4)),
    gameSettings
  };
}

function ensureRoomShape(game) {
  if (!game.title) {
    game.title = `Комната ${game.roomCode}`;
  }
  if (!game.privacy) {
    game.privacy = "private";
  }
  if (!game.maxPlayers) {
    game.maxPlayers = 4;
  }
  if (!Array.isArray(game.spectators)) {
    game.spectators = [];
  }
  if (typeof game.archivedAt === "undefined") {
    game.archivedAt = null;
  }
  if (!game.settings) {
    game.settings = normalizeGameSettings(game.gameSettings || {});
  }
  if (!Number.isFinite(game.turnCount)) {
    game.turnCount = 0;
  }
  if (!Number.isFinite(game.round)) {
    game.round = 1;
  }
  if (!Array.isArray(game.debugLog)) {
    game.debugLog = [];
  }
  if (!Array.isArray(game.historySnapshots)) {
    game.historySnapshots = [];
  }
}

function normalizeGameSettings(options = {}) {
  const rawLength = String(options.gameLength || options.length || "open");
  const rawVictory = String(options.victoryMode || "classic");
  const lengthKey = GAME_LENGTHS[rawLength] ? rawLength : "open";
  const victoryMode = VICTORY_MODES[rawVictory] ? rawVictory : "classic";
  const explicitMaxTurns = Number(options.maxTurns);
  const maxTurns = Number.isFinite(explicitMaxTurns)
    ? Math.min(180, Math.max(1, Math.floor(explicitMaxTurns)))
    : GAME_LENGTHS[lengthKey].maxTurns;
  return {
    gameLength: lengthKey,
    victoryMode,
    maxTurns
  };
}

function createGame(roomCode, hostName, professionId, hostAccountId = null, options = {}) {
  const settings = normalizeRoomSettings({ ...options, roomCode });
  const host = createPlayer(makeId(), hostName || "Хост", professionId, hostAccountId);
  return {
    roomCode,
    title: settings.title,
    privacy: settings.privacy,
    maxPlayers: settings.maxPlayers,
    settings: settings.gameSettings,
    archivedAt: null,
    status: "lobby",
    hostId: host.id,
    players: [host],
    spectators: [],
    currentPlayerIndex: 0,
    turnCount: 0,
    round: 1,
    winnerId: null,
    log: [`Комната ${roomCode} создана.`],
    debugLog: [],
    historySnapshots: [],
    chat: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function addPlayer(game, name, professionId, accountId = null) {
  ensureRoomShape(game);
  assertRoomOpen(game);
  if (game.status !== "lobby") {
    throw new Error("Игра уже началась.");
  }
  if (accountId) {
    const existing = game.players.find((item) => item.accountId === accountId);
    if (existing) {
      return existing;
    }
  }
  if (game.players.length >= game.maxPlayers) {
    throw new Error(`В комнате максимум ${game.maxPlayers} игрока.`);
  }
  if (accountId) {
    game.spectators = game.spectators.filter((item) => item.accountId !== accountId);
  }
  const player = createPlayer(makeId(), name || `Игрок ${game.players.length + 1}`, professionId, accountId);
  game.players.push(player);
  game.log.unshift(`${player.name} присоединился к комнате.`);
  touch(game);
  return player;
}

function addSpectator(game, name, accountId = null) {
  ensureRoomShape(game);
  assertRoomOpen(game);
  if (accountId && game.players.some((player) => player.accountId === accountId)) {
    throw new Error("Этот аккаунт уже играет в комнате.");
  }
  if (accountId) {
    const existing = game.spectators.find((item) => item.accountId === accountId);
    if (existing) {
      return existing;
    }
  }
  const spectator = {
    id: makeId(),
    accountId,
    name: String(name || `Наблюдатель ${game.spectators.length + 1}`).slice(0, 24),
    joinedAt: Date.now()
  };
  game.spectators.push(spectator);
  game.log.unshift(`${spectator.name} наблюдает за комнатой.`);
  touch(game);
  return spectator;
}

function updateRoomSettings(game, hostId, settings = {}) {
  ensureRoomShape(game);
  assertRoomOpen(game);
  assertHost(game, hostId);
  const next = normalizeRoomSettings({
    title: settings.title ?? game.title,
    privacy: settings.privacy ?? game.privacy,
    maxPlayers: settings.maxPlayers ?? game.maxPlayers,
    roomCode: game.roomCode
  });
  if (next.maxPlayers < game.players.length) {
    throw new Error("Лимит не может быть меньше текущего числа игроков.");
  }
  game.title = next.title;
  game.privacy = next.privacy;
  game.maxPlayers = next.maxPlayers;
  game.settings = normalizeGameSettings({
    ...game.settings,
    ...(settings.gameSettings || {}),
    gameLength: settings.gameLength ?? settings.gameSettings?.gameLength ?? game.settings.gameLength,
    victoryMode: settings.victoryMode ?? settings.gameSettings?.victoryMode ?? game.settings.victoryMode,
    maxTurns: settings.maxTurns ?? settings.gameSettings?.maxTurns ?? game.settings.maxTurns
  });
  game.log.unshift("Настройки комнаты обновлены.");
  recordDebug(game, "room.settings", { hostId, settings: game.settings });
  touch(game);
}

function transferHost(game, hostId, targetPlayerId) {
  ensureRoomShape(game);
  assertRoomOpen(game);
  assertHost(game, hostId);
  const nextHost = game.players.find((player) => player.id === targetPlayerId);
  if (!nextHost) {
    throw new Error("Новый хост не найден среди игроков.");
  }
  game.hostId = nextHost.id;
  game.log.unshift(`${nextHost.name} теперь хост комнаты.`);
  touch(game);
}

function leaveRoom(game, playerId) {
  ensureRoomShape(game);
  assertRoomOpen(game);
  const playerIndex = game.players.findIndex((player) => player.id === playerId);
  if (playerIndex < 0) {
    const spectatorIndex = game.spectators.findIndex((spectator) => spectator.id === playerId);
    if (spectatorIndex < 0) {
      throw new Error("Участник не найден.");
    }
    const [spectator] = game.spectators.splice(spectatorIndex, 1);
    game.log.unshift(`${spectator.name} вышел из наблюдения.`);
    touch(game);
    return { archived: false };
  }

  const activePlayerId = currentPlayer(game)?.id || null;
  const [player] = game.players.splice(playerIndex, 1);
  if (game.players.length === 0) {
    game.archivedAt = Date.now();
    game.log.unshift("Комната архивирована: игроков не осталось.");
    touch(game);
    return { archived: true };
  }
  if (player.id === game.hostId) {
    game.hostId = game.players[0].id;
    game.log.unshift(`${game.players[0].name} теперь хост комнаты.`);
  }
  const nextActiveIndex = activePlayerId ? game.players.findIndex((item) => item.id === activePlayerId) : -1;
  game.currentPlayerIndex = nextActiveIndex >= 0 ? nextActiveIndex : Math.min(game.currentPlayerIndex, game.players.length - 1);
  game.log.unshift(`${player.name} покинул комнату.`);
  touch(game);
  return { archived: false };
}

function archiveRoom(game, hostId) {
  ensureRoomShape(game);
  assertHost(game, hostId);
  if (!game.archivedAt) {
    game.archivedAt = Date.now();
    game.log.unshift("Комната архивирована.");
    touch(game);
  }
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
  game.turnCount = 0;
  game.round = 1;
  game.players.forEach((player) => {
    player.ready = false;
  });
  game.historySnapshots = [];
  game.log.unshift("Игра началась.");
  recordDebug(game, "game.start", { hostId, players: game.players.map((player) => player.id), settings: game.settings });
  captureHistorySnapshot(game, "start");
  touch(game);
}

function restartGame(game, hostId) {
  assertHost(game, hostId);
  const previousWinner = game.players.find((player) => player.id === game.winnerId);
  const players = game.players.map((player) => resetPlayerForNewGame(player));
  game.status = "lobby";
  game.players = players;
  game.currentPlayerIndex = 0;
  game.turnCount = 0;
  game.round = 1;
  game.winnerId = null;
  delete game.finishReason;
  delete game.resultRecordedAt;
  game.historySnapshots = [];
  game.log.unshift(previousWinner ? `Новая партия создана. Прошлый победитель: ${previousWinner.name}.` : "Новая партия создана.");
  recordDebug(game, "game.restart", { hostId, previousWinnerId: previousWinner?.id || null });
  touch(game);
}

function kickPlayer(game, hostId, playerId) {
  ensureRoomShape(game);
  assertRoomOpen(game);
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
  ensureRoomShape(game);
  validateGameState(game);
  if (game.status !== "playing") {
    throw new Error("Игра ещё не началась.");
  }
  const player = currentPlayer(game);
  if (!player || player.id !== playerId) {
    throw new Error("Сейчас ход другого игрока.");
  }
  if (hasPendingDecision(player)) {
    throw new Error("Сначала завершите текущее решение.");
  }

  if (player.skippedTurns > 0) {
    player.skippedTurns -= 1;
    player.lastRoll = 0;
    game.log.unshift(`${player.name} пропускает ход после сокращения.`);
    recordDebug(game, "turn.skip", { playerId: player.id, skippedTurns: player.skippedTurns });
    advanceTurn(game);
    touch(game);
    return { kind: "skip", player };
  }

  const roll = rollDie();
  player.lastRoll = roll;
  const event = player.track === "project-league"
    ? takeProjectTurn(game, player, roll)
    : takeMoneyYardTurn(game, player, roll);
  recordDebug(game, "turn.roll", { playerId: player.id, roll, track: player.track, event: event.kind });

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
  ensureRoomShape(game);
  const player = game.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Игрок не найден.");
  }
  if (player.track !== "project-league") {
    throw new Error("Большая цель доступна в Лиге проектов.");
  }
  if (!allowsGoalVictory(game)) {
    throw new Error("В этом режиме победа через большую цель отключена.");
  }
  if (player.cash < player.grandGoal.cost) {
    throw new Error("Недостаточно денег для большой цели.");
  }

  player.cash -= player.grandGoal.cost;
  finishGame(game, player.id, "goal");
  game.log.unshift(`${player.name} закрывает большую цель "${player.grandGoal.title}" и выигрывает игру.`);
  recordDebug(game, "victory.goal", { playerId: player.id, goalId: player.grandGoal.id });
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
      const amount = Number(card.amount || 0);
      player.cash += amount;
      const signed = amount >= 0 ? `+${money(amount)}` : `-${money(Math.abs(amount))}`;
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

  message += applyFinancialStress(game, player);
  game.log.unshift(message);
  recordDebug(game, "cell.resolve", { playerId: player.id, track: player.track, cell: cell.type, roll });
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
    if (allowsGoalVictory(game) && player.cash >= player.grandGoal.cost) {
      player.cash -= player.grandGoal.cost;
      finishGame(game, player.id, "goal");
      message += ` ${player.name} закрывает большую цель "${player.grandGoal.title}" за ${money(player.grandGoal.cost)} и выигрывает.`;
    } else if (!allowsGoalVictory(game)) {
      message += ` В этом режиме большая цель не завершает партию.`;
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

  message += applyFinancialStress(game, player);
  game.log.unshift(message);
  recordDebug(game, "cell.resolve", { playerId: player.id, track: player.track, cell: cell.type, roll });
  checkProgress(game, player);
  return { kind: `fast-${cell.type}`, player, cell, message };
}

function currentPlayer(game) {
  return game.players[game.currentPlayerIndex] || null;
}

function hasPendingDecision(player) {
  return Boolean(player.pendingOpportunity || player.pendingOpportunityChoice || player.pendingMarketOffer || player.pendingProjectDeal || player.pendingFinancialStress);
}

function advanceTurn(game) {
  ensureRoomShape(game);
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  game.turnCount += 1;
  game.round = Math.floor(game.turnCount / Math.max(1, game.players.length)) + 1;
  checkTurnLimit(game);
  if (game.status !== "finished") {
    captureHistorySnapshot(game, "turn");
  }
}

function checkProgress(game, player) {
  if (game.status === "finished") {
    return;
  }

  if (player.track === "money-yard" && canEnterProjectLeague(player)) {
    enterProjectLeague(game, player);
    return;
  }

  if (player.track === "project-league" && allowsPortfolioVictory(game) && hasWinningProjectPortfolio(player)) {
    finishGame(game, player.id, "portfolio");
    game.log.unshift(`${player.name} выигрывает: портфель проектов стал устойчивым.`);
    recordDebug(game, "victory.portfolio", { playerId: player.id, projectIncome: player.projectIncome, projectAssets: projectAssetCount(player) });
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

function applyFinancialStress(game, player) {
  let message = "";
  const stressLimit = -Math.max(1200, Math.round(player.expenses * 0.75));
  const crisisLimit = -Math.max(2400, Math.round(player.expenses * 1.5));
  if (player.cash >= stressLimit) {
    return message;
  }

  delete player.pendingOpportunity;
  delete player.pendingOpportunityChoice;
  delete player.pendingMarketOffer;
  delete player.pendingProjectDeal;
  player.pendingFinancialStress = {
    cash: player.cash,
    stressLimit,
    crisisLimit,
    canLiquidate: player.assets.length > 0,
    canRestructure: player.cash < crisisLimit && player.liabilities.some((liability) => !liability.restructured),
    bankruptcy: player.cash < crisisLimit,
    assetTitle: player.assets.length
      ? [...player.assets].sort((a, b) => (a.marketValue || a.cost || 0) - (b.marketValue || b.cost || 0))[0].title
      : null,
    liabilityTitle: player.liabilities.find((liability) => !liability.restructured)?.title || null
  };
  message += " Требуется финансовое решение.";
  recordDebug(game, "debt.pending", { playerId: player.id, cash: player.cash });
  return message;
}

function confirmFinancialStress(game, playerId) {
  ensureRoomShape(game);
  const player = game.players.find((item) => item.id === playerId);
  if (!player || !player.pendingFinancialStress) {
    throw new Error("Нет финансового решения.");
  }

  const crisisLimit = player.pendingFinancialStress.crisisLimit;
  let message = "";

  if (player.assets.length > 0 && player.cash < player.pendingFinancialStress.stressLimit) {
    const asset = [...player.assets].sort((a, b) => (a.marketValue || a.cost || 0) - (b.marketValue || b.cost || 0))[0];
    const sale = liquidateAsset(player, asset.id, 0.72);
    message += ` Автоликвидация "${asset.title}": ${money(sale.net)}.`;
    recordDebug(game, "debt.asset-liquidation", { playerId: player.id, assetId: asset.id, net: sale.net });
  }

  if (player.cash < crisisLimit && player.liabilities.length > 0) {
    const restructured = restructureLargestLiability(player);
    if (restructured) {
      message += ` Реструктуризация "${restructured.title}": платёж снижен на ${money(restructured.paymentReduction)}.`;
      recordDebug(game, "debt.restructure", { playerId: player.id, title: restructured.title, paymentReduction: restructured.paymentReduction });
    }
  }

  if (player.cash < crisisLimit) {
    player.bankruptcyCount = (player.bankruptcyCount || 0) + 1;
    player.cash = 0;
    player.reputation = Math.max(0, (player.reputation || 0) - 2);
    player.skippedTurns = Math.max(player.skippedTurns || 0, 1);
    delete player.pendingOpportunity;
    delete player.pendingOpportunityChoice;
    delete player.pendingMarketOffer;
    delete player.pendingProjectDeal;
    message += " Банкротство: кэш обнулён, репутация снижена, следующий ход пропускается.";
    recordDebug(game, "debt.bankruptcy", { playerId: player.id, bankruptcyCount: player.bankruptcyCount });
  }

  delete player.pendingFinancialStress;
  game.log.unshift(`${player.name} завершает финансовую реструктуризацию.${message}`);
  if (currentPlayer(game)?.id === player.id) {
    advanceTurn(game);
  }
  touch(game);
  return game;
}

function liquidateAsset(player, assetId, multiplier = 0.72) {
  const assetIndex = player.assets.findIndex((asset) => asset.id === assetId);
  if (assetIndex < 0) {
    return { net: 0 };
  }
  const asset = player.assets[assetIndex];
  const liabilityIndex = player.liabilities.findIndex((liability) => liability.id === asset.id);
  const debt = liabilityIndex >= 0 ? player.liabilities[liabilityIndex].balance : 0;
  const payment = liabilityIndex >= 0 ? player.liabilities[liabilityIndex].payment : 0;
  const price = Math.round((asset.marketValue || asset.cost || 0) * multiplier);
  const net = price - debt;
  player.cash += net;
  player.passiveIncome = Math.max(0, player.passiveIncome - (asset.passiveIncome || 0));
  if (asset.type === "project-league") {
    player.projectIncome = Math.max(0, player.projectIncome - (asset.passiveIncome || 0));
  }
  player.expenses = Math.max(0, player.expenses - payment);
  player.assets.splice(assetIndex, 1);
  if (liabilityIndex >= 0) {
    player.liabilities.splice(liabilityIndex, 1);
  }
  return { price, debt, net };
}

function restructureLargestLiability(player) {
  const liability = [...player.liabilities].sort((a, b) => b.payment - a.payment)[0];
  if (!liability || liability.restructured) {
    return null;
  }
  const oldPayment = liability.payment;
  const paymentReduction = Math.max(40, Math.round(oldPayment * 0.35));
  liability.payment = Math.max(20, oldPayment - paymentReduction);
  liability.balance = Math.round(liability.balance * 1.12);
  liability.restructured = true;
  player.expenses = Math.max(0, player.expenses - (oldPayment - liability.payment));
  player.cash += Math.round(player.expenses * 0.25);
  return {
    title: liability.title,
    paymentReduction: oldPayment - liability.payment
  };
}

function allowsGoalVictory(game) {
  const mode = game.settings?.victoryMode || "classic";
  return mode === "classic" || mode === "goal";
}

function allowsPortfolioVictory(game) {
  const mode = game.settings?.victoryMode || "classic";
  return mode === "classic" || mode === "portfolio";
}

function checkTurnLimit(game) {
  if (game.status === "finished") {
    return;
  }
  const maxTurns = game.settings?.maxTurns;
  if (!maxTurns || game.turnCount < maxTurns) {
    return;
  }
  const winner = [...game.players].sort((a, b) => playerNetWorth(b) - playerNetWorth(a))[0];
  if (winner) {
    finishGame(game, winner.id, "turn-limit");
    game.log.unshift(`${winner.name} выигрывает по капиталу после лимита ходов.`);
    recordDebug(game, "victory.turn-limit", { playerId: winner.id, turnCount: game.turnCount, netWorth: playerNetWorth(winner) });
  }
}

function finishGame(game, winnerId, reason) {
  if (game.status === "finished") {
    return;
  }
  game.status = "finished";
  game.winnerId = winnerId;
  game.finishReason = reason;
  captureHistorySnapshot(game, "finish");
}

function playerNetWorth(player) {
  const assetValue = player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0);
  const liabilities = player.liabilities.reduce((sum, liability) => sum + (liability.balance || 0), 0);
  return player.cash + assetValue - liabilities;
}

function captureHistorySnapshot(game, kind = "turn") {
  ensureRoomShape(game);
  const snapshot = {
    kind,
    turnCount: game.turnCount || 0,
    round: game.round || 1,
    status: game.status,
    currentPlayerId: currentPlayer(game)?.id || null,
    createdAt: Date.now(),
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      professionId: player.professionId,
      profession: player.profession,
      track: player.track || "money-yard",
      netWorth: playerNetWorth(player),
      cash: player.cash,
      passiveIncome: player.passiveIncome,
      projectIncome: player.projectIncome || 0,
      projectAssets: projectAssetCount(player),
      reputation: player.reputation || 0,
      bankruptcyCount: player.bankruptcyCount || 0
    }))
  };
  game.historySnapshots.push(snapshot);
  game.historySnapshots = game.historySnapshots.slice(-160);
}

function validateGameState(game) {
  ensureRoomShape(game);
  if (!Array.isArray(game.players) || game.players.length === 0) {
    throw new Error("В комнате нет игроков.");
  }
  const playerIds = new Set();
  for (const player of game.players) {
    if (!player.id || playerIds.has(player.id)) {
      throw new Error("Некорректное состояние игроков.");
    }
    playerIds.add(player.id);
    if (!Number.isFinite(player.cash) || !Number.isFinite(player.expenses) || !Number.isFinite(player.passiveIncome)) {
      throw new Error("Некорректные финансовые значения игрока.");
    }
    const pendingCount = [player.pendingOpportunity, player.pendingOpportunityChoice, player.pendingMarketOffer, player.pendingProjectDeal, player.pendingFinancialStress]
      .filter(Boolean).length;
    if (pendingCount > 1) {
      throw new Error("У игрока несколько незавершённых решений.");
    }
  }
  if (game.currentPlayerIndex < 0 || game.currentPlayerIndex >= game.players.length) {
    throw new Error("Некорректная очередь хода.");
  }
  if (game.winnerId && !playerIds.has(game.winnerId)) {
    throw new Error("Победитель отсутствует среди игроков.");
  }
  return true;
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
  ensureRoomShape(game);
  if (!game.hostId && game.players[0]) {
    game.hostId = game.players[0].id;
  }
  return {
    ...game,
    currentPlayerId: currentPlayer(game)?.id || null,
    chat: game.chat.slice(-80),
    debugLog: game.debugLog.slice(-120),
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
  ensureRoomShape(game);
  if (!game.hostId && game.players[0]) {
    game.hostId = game.players[0].id;
  }
  if (!playerId || playerId !== game.hostId) {
    throw new Error("Это действие доступно только хосту.");
  }
}

function assertRoomOpen(game) {
  if (game.archivedAt) {
    throw new Error("Комната архивирована.");
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
    gameLengths: Object.entries(GAME_LENGTHS).map(([id, item]) => ({ id, ...item })),
    victoryModes: Object.entries(VICTORY_MODES).map(([id, item]) => ({ id, ...item })),
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

function recordDebug(game, type, payload = {}) {
  ensureRoomShape(game);
  game.debugLog.push({
    id: makeId(),
    type,
    payload,
    turnCount: game.turnCount || 0,
    round: game.round || 1,
    createdAt: Date.now()
  });
  game.debugLog = game.debugLog.slice(-300);
}

module.exports = {
  CELLS,
  PROFESSIONS,
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
  validateGameState,
  makeRoomCode
};
