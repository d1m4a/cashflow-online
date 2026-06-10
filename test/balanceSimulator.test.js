const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateBatch, simulateGame } = require("../shared/balanceSimulator");
const { serializeRules } = require("../shared/gameRules");

test("balance simulator finishes quick games without rule errors", () => {
  const summary = simulateBatch({ games: 30, playersPerGame: 4, seed: 100, gameLength: "quick" });

  assert.equal(summary.games, 30);
  assert.equal(summary.finished, 30);
  assert.equal(summary.errors.length, 0);
  assert.ok(summary.averageTurns > 0);
  assert.ok(summary.finishReasons["turn-limit"] > 0 || summary.finishReasons.goal > 0 || summary.finishReasons.portfolio > 0);
});

test("balance simulator is deterministic for the same seed", () => {
  const first = simulateBatch({ games: 20, playersPerGame: 3, seed: 77, gameLength: "quick" });
  const second = simulateBatch({ games: 20, playersPerGame: 3, seed: 77, gameLength: "quick" });

  assert.deepEqual(
    first.professions.map((item) => [item.id, item.games, item.wins, item.averageNetWorth]),
    second.professions.map((item) => [item.id, item.games, item.wins, item.averageNetWorth])
  );
  assert.deepEqual(first.finishReasons, second.finishReasons);
});

test("simulation summary covers every profession", () => {
  const rules = serializeRules();
  const summary = simulateBatch({ games: rules.professions.length, playersPerGame: 4, seed: 7, gameLength: "quick" });

  assert.equal(summary.professions.length, rules.professions.length);
  assert.ok(summary.professions.every((profession) => profession.games > 0));
});

test("quick-game starting balance avoids dominant professions", () => {
  const summary = simulateBatch({ games: 100, playersPerGame: 4, seed: 123, gameLength: "quick" });
  const winRates = summary.professions.filter((profession) => profession.games > 0).map((profession) => profession.winRate);

  assert.ok(Math.max(...winRates) <= 0.45);
  assert.ok(Math.min(...winRates) >= 0.05);
});

test("single simulated game returns replay-friendly result rows", () => {
  const result = simulateGame({
    roomCode: "SIMX1",
    professions: ["event-host", "repair-master", "junior-developer"],
    gameLength: "quick",
    victoryMode: "netWorth",
    maxTurns: 4
  });

  assert.equal(result.status, "finished");
  assert.equal(result.finishReason, "turn-limit");
  assert.equal(result.players.length, 3);
  assert.ok(result.players.every((player) => typeof player.netWorth === "number"));
  assert.equal(result.errors.length, 0);
});
