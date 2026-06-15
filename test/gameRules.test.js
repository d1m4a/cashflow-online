const test = require("node:test");
const assert = require("node:assert/strict");
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
  passOpportunityChoice,
  acceptMarketOffer,
  repayLiability,
  buyGrandGoal,
  buyProjectDeal,
  passProjectDeal,
  confirmFinancialStress,
  serializeGame,
  serializeRules,
  validateGameState
} = require("../shared/gameRules");

function makeStartedGame(professionId = "event-host") {
  const game = createGame("ABCDE", "Alice", professionId);
  startGame(game, game.hostId);
  return game;
}

test("only host starts when joined players are ready", () => {
  const game = createGame("ABCDE", "Alice", "event-host");
  const bob = addPlayer(game, "Bob", "repair-master");

  assert.throws(() => startGame(game, bob.id), /только хосту/);
  assert.throws(() => startGame(game, game.hostId), /Не все игроки готовы/);

  setPlayerReady(game, bob.id, true);
  startGame(game, game.hostId);

  assert.equal(game.status, "playing");
  assert.equal(game.players.every((player) => !player.ready), true);
});

test("host can kick lobby player and restart finished game in same room", () => {
  const game = createGame("ABCDE", "Alice", "event-host");
  const bob = addPlayer(game, "Bob", "repair-master");

  kickPlayer(game, game.hostId, bob.id);

  assert.equal(game.players.some((player) => player.id === bob.id), false);

  startGame(game, game.hostId);
  const host = game.players[0];
  host.track = "project-league";
  host.cash = host.grandGoal.cost;
  buyGrandGoal(game, host.id);
  restartGame(game, game.hostId);

  assert.equal(game.roomCode, "ABCDE");
  assert.equal(game.status, "lobby");
  assert.equal(game.winnerId, null);
  assert.equal(game.players[0].id, host.id);
  assert.equal(game.players[0].name, "Alice");
  assert.equal(game.players[0].track, "money-yard");
});

test("opportunity choice keeps the turn until the player chooses or skips", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  player.pendingOpportunityChoice = true;

  const card = drawOpportunity(game, player.id, "small");

  assert.equal(card.type, "small");
  assert.equal(game.currentPlayerIndex, 0);
  assert.equal(player.pendingOpportunityChoice, undefined);
  assert.equal(player.pendingOpportunity.type, "small");
});

test("opportunity choice can be skipped and advances the turn", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  player.pendingOpportunityChoice = true;

  passOpportunityChoice(game, player.id);

  assert.equal(player.pendingOpportunityChoice, undefined);
  assert.equal(game.currentPlayerIndex, 0);
});

test("financed purchase creates an asset, liability, expense payment and invest income", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  player.cash = 1_000;
  player.pendingOpportunity = {
    id: "test-rental",
    type: "large",
    title: "Тестовая аренда",
    text: "Проверочная карточка.",
    cost: 3_000,
    downPayment: 800,
    loan: 2_200,
    payment: 180,
    marketValue: 3_500,
    passiveIncome: 500
  };
  const expensesBefore = player.expenses;

  buyOpportunity(game, player.id, "finance");

  assert.equal(player.cash, 200);
  assert.equal(player.passiveIncome, 500);
  assert.equal(player.expenses, expensesBefore + 180);
  assert.equal(player.assets.length, 1);
  assert.equal(player.assets[0].loan, 2_200);
  assert.equal(player.liabilities.at(-1).balance, 2_200);
  assert.equal(player.pendingOpportunity, undefined);
});

test("market sale removes the asset and linked liability payment", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  const asset = {
    id: "asset-1",
    title: "Аренда",
    type: "large",
    cost: 3_000,
    downPayment: 800,
    loan: 2_000,
    payment: 150,
    marketValue: 3_500,
    passiveIncome: 400
  };
  player.assets.push(asset);
  player.liabilities.push({ id: asset.id, title: "Кредит: Аренда", payment: 150, balance: 2_000 });
  player.cash = 100;
  player.expenses += 150;
  player.passiveIncome = 400;
  player.pendingMarketOffer = {
    assetId: asset.id,
    assetTitle: asset.title,
    title: "Покупатель",
    price: 3_000,
    text: "Проверочная продажа."
  };

  acceptMarketOffer(game, player.id);

  assert.equal(player.cash, 1_100);
  assert.equal(player.passiveIncome, 0);
  assert.equal(player.assets.length, 0);
  assert.equal(player.liabilities.some((item) => item.id === asset.id), false);
  assert.equal(player.pendingMarketOffer, undefined);
});

test("project league opens only after reputation and reserve goals are met", () => {
  const game = makeStartedGame("event-host");
  const player = game.players[0];
  const liability = player.liabilities[0];
  player.cash = liability.balance + player.expenses * 2;
  player.reputation = 5;

  repayLiability(game, player.id, liability.id);

  assert.equal(player.liabilities.some((item) => item.id === liability.id), false);
  assert.equal(player.track, "project-league");
  assert.equal(game.status, "playing");
  assert.equal(game.winnerId, null);
});

test("completing a grand goal in project league wins the game", () => {
  const game = makeStartedGame("event-host");
  const player = game.players[0];
  player.track = "project-league";
  player.cash = player.grandGoal.cost;

  buyGrandGoal(game, player.id);

  assert.equal(game.status, "finished");
  assert.equal(game.winnerId, player.id);
  assert.equal(player.cash, 0);
});

test("project deal can be bought or skipped as an explicit project league decision", () => {
  const game = makeStartedGame("event-host");
  const player = game.players[0];
  player.track = "project-league";
  player.cash = 5000;
  player.pendingProjectDeal = {
    id: "test-project",
    title: "Тестовый проект",
    text: "Проверочная карточка проекта.",
    cost: 4200,
    marketValue: 5200,
    upkeep: 170,
    passiveIncome: 850
  };
  const expensesBefore = player.expenses;

  buyProjectDeal(game, player.id);

  assert.equal(player.cash, 800);
  assert.equal(player.projectIncome, 850);
  assert.equal(player.expenses, expensesBefore + 170);
  assert.equal(player.assets.at(-1).type, "project-league");
  assert.equal(player.assets.at(-1).payment, 170);
  assert.equal(player.pendingProjectDeal, undefined);

  player.pendingProjectDeal = {
    id: "skip-project",
    title: "Проект для пропуска",
    text: "Проверочная карточка проекта.",
    cost: 4200,
    marketValue: 5200,
    upkeep: 170,
    passiveIncome: 850
  };

  passProjectDeal(game, player.id);

  assert.equal(player.pendingProjectDeal, undefined);
});

test("project portfolio victory requires both income and enough project assets", () => {
  const game = makeStartedGame("event-host");
  const player = game.players[0];
  player.track = "project-league";
  player.projectIncome = 6200;
  player.assets = [
    { id: "p1", title: "Проект 1", type: "project-league", passiveIncome: 2100 },
    { id: "p2", title: "Проект 2", type: "project-league", passiveIncome: 2100 }
  ];
  player.pendingProjectDeal = {
    id: "p3",
    title: "Проект 3",
    text: "Финальный проект портфеля.",
    cost: 1000,
    marketValue: 1400,
    upkeep: 25,
    passiveIncome: 100
  };
  player.cash = 1000;

  buyProjectDeal(game, player.id);

  assert.equal(game.status, "finished");
  assert.equal(game.winnerId, player.id);
  assert.equal(serializeGame(game).players[0].projectAssetCount, 3);
});

test("selling a project asset lowers project income and maintenance", () => {
  const game = makeStartedGame("event-host");
  const player = game.players[0];
  player.track = "project-league";
  player.cash = 100;
  player.projectIncome = 1250;
  player.passiveIncome = 1250;
  player.expenses += 260;
  player.assets.push({
    id: "project-asset",
    title: "Проект на продажу",
    type: "project-league",
    cost: 6200,
    downPayment: 6200,
    loan: 0,
    payment: 260,
    marketValue: 7800,
    passiveIncome: 1250
  });
  player.pendingMarketOffer = {
    assetId: "project-asset",
    assetTitle: "Проект на продажу",
    title: "Покупатель проекта",
    price: 8000,
    text: "Проверочная продажа проекта."
  };

  acceptMarketOffer(game, player.id);
  const state = serializeGame(game).players[0];

  assert.equal(player.cash, 8100);
  assert.equal(player.projectIncome, 0);
  assert.equal(player.passiveIncome, 0);
  assert.equal(state.projectMaintenanceCost, 0);
  assert.equal(state.projectNetIncome, 0);
});

test("serialized game includes computed financial fields and public professions", () => {
  const game = makeStartedGame();
  const state = serializeGame(game);
  const player = state.players[0];

  assert.equal(typeof state.currentPlayerId, "string");
  assert.ok(state.professions.length >= 5);
  assert.equal(player.totalIncome, player.salary + player.passiveIncome);
  assert.equal(player.monthlySurplus, player.totalIncome - player.expenses);
  assert.equal(player.liabilityBalance, player.liabilities.reduce((sum, item) => sum + item.balance, 0));
  assert.equal(player.track, "money-yard");
  assert.equal(typeof player.grandGoal.title, "string");
  assert.equal(typeof player.projectReadiness.ready, "boolean");
});

test("serialized rules expose board cells and profession setup data", () => {
  const rules = serializeRules();

  assert.equal(rules.boardSize, rules.cells.length);
  assert.ok(rules.projectCells.length > 0);
  assert.ok(rules.grandGoals.length > 0);
  assert.ok(rules.gameLengths.some((item) => item.id === "quick" && item.maxTurns > 0));
  assert.ok(rules.victoryModes.some((item) => item.id === "netWorth"));
  assert.equal(typeof rules.projectIncomeGoal, "number");
  assert.equal(typeof rules.projectPortfolioGoal, "number");
  assert.equal(typeof rules.reputationGoal, "number");
  assert.equal(rules.reputationGoal, 5);
  assert.ok(rules.cells.some((cell) => cell.type === "opportunity"));
  assert.ok(rules.professions.every((profession) => profession.liabilities));
  assert.ok(rules.professions.every((profession) => !("assets" in profession)));
});

test("starter professions keep distinct but playable money profiles", () => {
  const rules = serializeRules();
  const surpluses = rules.professions.map((profession) => profession.salary - profession.expenses);
  const cashValues = rules.professions.map((profession) => profession.cash);
  const lowestSurplus = Math.min(...surpluses);
  const highestSurplus = Math.max(...surpluses);
  const lowestCash = Math.min(...cashValues);

  assert.ok(lowestSurplus >= 800);
  assert.ok(highestSurplus - lowestSurplus >= 250);
  assert.ok(lowestCash >= 1000);
  assert.ok(rules.professions.length >= 10);
  assert.ok(rules.professions.every((profession) => profession.liabilities.length >= 1));
});

test("serialized multiplayer state keeps money-yard and project-league players visible together", () => {
  const game = createGame("ROOM1", "Alice", "event-host");
  const bob = addPlayer(game, "Bob", "repair-master");
  setPlayerReady(game, bob.id, true);
  startGame(game, game.hostId);

  game.players[0].track = "project-league";
  game.players[0].projectPosition = 3;
  bob.track = "money-yard";
  bob.position = 5;

  const state = serializeGame(game);
  const rules = serializeRules();
  const aliceState = state.players.find((player) => player.name === "Alice");
  const bobState = state.players.find((player) => player.name === "Bob");

  assert.equal(state.players.length, 2);
  assert.equal(aliceState.track, "project-league");
  assert.equal(aliceState.projectPosition, 3);
  assert.equal(bobState.track, "money-yard");
  assert.equal(bobState.position, 5);
  assert.ok(rules.cells.length > 0);
  assert.ok(rules.projectCells.length > 0);
});

test("game settings support turn-limit net worth victory", () => {
  const game = createGame("LIMIT", "Alice", "event-host", null, {
    gameLength: "quick",
    victoryMode: "netWorth",
    maxTurns: 1
  });
  startGame(game, game.hostId);
  const player = game.players[0];
  player.cash = 50_000;
  player.skippedTurns = 1;

  takeTurn(game, player.id);

  assert.equal(game.status, "finished");
  assert.equal(game.winnerId, player.id);
  assert.equal(game.finishReason, "turn-limit");
  assert.equal(game.turnCount, 1);
});

test("victory modes can disable portfolio or goal wins", () => {
  const goalOnly = createGame("GOAL1", "Alice", "event-host", null, { victoryMode: "goal" });
  startGame(goalOnly, goalOnly.hostId);
  const goalPlayer = goalOnly.players[0];
  goalPlayer.track = "project-league";
  goalPlayer.projectIncome = 7_000;
  goalPlayer.assets = [
    { id: "p1", title: "P1", type: "project-league", passiveIncome: 2500 },
    { id: "p2", title: "P2", type: "project-league", passiveIncome: 2500 },
    { id: "p3", title: "P3", type: "project-league", passiveIncome: 2500 }
  ];
  goalPlayer.pendingProjectDeal = {
    id: "extra",
    title: "Extra",
    text: "Extra project",
    cost: 1,
    marketValue: 1,
    upkeep: 0,
    passiveIncome: 1
  };
  goalPlayer.cash = 1;

  buyProjectDeal(goalOnly, goalPlayer.id);

  assert.equal(goalOnly.status, "playing");

  const portfolioOnly = createGame("PORT1", "Alice", "event-host", null, { victoryMode: "portfolio" });
  startGame(portfolioOnly, portfolioOnly.hostId);
  const portfolioPlayer = portfolioOnly.players[0];
  portfolioPlayer.track = "project-league";
  portfolioPlayer.cash = portfolioPlayer.grandGoal.cost;

  assert.throws(() => buyGrandGoal(portfolioOnly, portfolioPlayer.id), /отключена/);
  assert.equal(portfolioOnly.status, "playing");
});

test("rules reject impossible pending decisions before a turn", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  player.pendingOpportunityChoice = true;

  assert.throws(() => takeTurn(game, player.id), /завершите текущее решение/);
});

test("validateGameState catches corrupted state and debug log records replay events", () => {
  const game = makeStartedGame();
  const player = game.players[0];

  validateGameState(game);
  takeTurn(game, player.id);

  assert.ok(serializeGame(game).debugLog.some((item) => item.type === "turn.roll"));

  game.players.push({ ...player });
  assert.throws(() => validateGameState(game), /Некорректное состояние игроков/);
});

test("financial stress can force liquidation before bankruptcy", () => {
  const game = makeStartedGame();
  const player = game.players[0];
  player.cash = -10_000;
  player.assets.push({
    id: "stress-asset",
    title: "Стрессовый актив",
    type: "large",
    cost: 3000,
    downPayment: 1000,
    loan: 0,
    payment: 0,
    marketValue: 5000,
    passiveIncome: 500
  });
  player.passiveIncome = 500;

  takeTurn(game, player.id);

  assert.ok(player.pendingFinancialStress);
  confirmFinancialStress(game, player.id);

  assert.equal(player.assets.some((asset) => asset.id === "stress-asset"), false);
  assert.ok(serializeGame(game).debugLog.some((item) => item.type === "debt.asset-liquidation"));
});

test("deep negative cash triggers restructuring and bankruptcy guardrails", () => {
  const game = makeStartedGame("logistics-analyst");
  const player = game.players[0];
  player.cash = -50_000;

  takeTurn(game, player.id);

  assert.ok(player.pendingFinancialStress);
  assert.ok(serializeGame(game).debugLog.some((item) => item.type === "debt.pending"));

  confirmFinancialStress(game, player.id);

  assert.equal(player.cash, 0);
  assert.equal(player.bankruptcyCount, 1);
  assert.ok(player.skippedTurns >= 1);
  assert.ok(player.liabilities.some((liability) => liability.restructured));
  assert.ok(serializeGame(game).debugLog.some((item) => item.type === "debt.bankruptcy"));
});
