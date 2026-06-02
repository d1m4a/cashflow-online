const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createGame,
  startGame,
  drawOpportunity,
  buyOpportunity,
  passOpportunityChoice,
  acceptMarketOffer,
  repayLiability,
  serializeGame,
  serializeRules
} = require("../shared/gameRules");

function makeStartedGame(professionId = "teacher") {
  const game = createGame("ABCDE", "Alice", professionId);
  startGame(game);
  return game;
}

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

test("financed purchase creates an asset, liability, expense payment and passive income", () => {
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

test("repaying a liability reduces expenses and can trigger victory", () => {
  const game = makeStartedGame("teacher");
  const player = game.players[0];
  const liability = player.liabilities[0];
  player.cash = liability.balance;
  player.passiveIncome = player.expenses - liability.payment;

  repayLiability(game, player.id, liability.id);

  assert.equal(player.liabilities.some((item) => item.id === liability.id), false);
  assert.equal(game.status, "finished");
  assert.equal(game.winnerId, player.id);
});

test("serialized game includes computed financial fields and public professions", () => {
  const game = makeStartedGame();
  const state = serializeGame(game);
  const player = state.players[0];

  assert.equal(typeof state.currentPlayerId, "string");
  assert.ok(state.professions.length >= 5);
  assert.equal(player.totalIncome, player.salary + player.passiveIncome);
  assert.equal(player.monthlyCashflow, player.totalIncome - player.expenses);
  assert.equal(player.liabilityBalance, player.liabilities.reduce((sum, item) => sum + item.balance, 0));
});

test("serialized rules expose board cells and profession setup data", () => {
  const rules = serializeRules();

  assert.equal(rules.boardSize, rules.cells.length);
  assert.ok(rules.cells.some((cell) => cell.type === "opportunity"));
  assert.ok(rules.professions.every((profession) => profession.liabilities));
  assert.ok(rules.professions.every((profession) => !("assets" in profession)));
});
