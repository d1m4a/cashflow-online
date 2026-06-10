const { simulateBatch } = require("../shared/balanceSimulator");

const args = new Map(process.argv.slice(2).map((item) => {
  const [key, value = "true"] = item.replace(/^--/, "").split("=");
  return [key, value];
}));

const summary = simulateBatch({
  games: Number(args.get("games") || 80),
  playersPerGame: Number(args.get("players") || 4),
  seed: Number(args.get("seed") || 42),
  gameLength: args.get("length") || "quick",
  victoryMode: args.get("victory") || "classic",
  maxTurns: args.has("maxTurns") ? Number(args.get("maxTurns")) : undefined
});

console.log(`Games: ${summary.games}, finished: ${summary.finished}, average turns: ${summary.averageTurns}`);
console.log(`Finish reasons: ${JSON.stringify(summary.finishReasons)}`);
if (summary.errors.length) {
  console.log(`Simulation errors: ${summary.errors.length}`);
  console.log(JSON.stringify(summary.errors.slice(0, 5), null, 2));
}
console.table(summary.professions.map((profession) => ({
  profession: profession.title,
  games: profession.games,
  wins: profession.wins,
  winRate: `${Math.round(profession.winRate * 100)}%`,
  avgNetWorth: profession.averageNetWorth,
  avgTurns: profession.averageTurns
})));
