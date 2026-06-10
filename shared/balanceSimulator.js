const {
  createGame,
  addPlayer,
  setPlayerReady,
  startGame,
  takeTurn,
  drawOpportunity,
  buyOpportunity,
  passOpportunity,
  passOpportunityChoice,
  buyProjectDeal,
  passProjectDeal,
  acceptMarketOffer,
  declineMarketOffer,
  repayLiability,
  serializeGame,
  serializeRules,
  validateGameState
} = require("./gameRules");

function simulateBatch(options = {}) {
  const rules = serializeRules();
  const games = Number(options.games || 50);
  const playersPerGame = Math.min(4, Math.max(1, Number(options.playersPerGame || 4)));
  const seed = Number(options.seed || 1);
  const results = [];

  withSeededRandom(seed, () => {
    for (let index = 0; index < games; index += 1) {
      const professionOffset = index % rules.professions.length;
      const professions = Array.from({ length: playersPerGame }, (_, playerIndex) => {
        return rules.professions[(professionOffset + playerIndex) % rules.professions.length].id;
      });
      results.push(simulateGame({
        roomCode: `SIM${String(index).padStart(2, "0")}`.slice(0, 5),
        professions,
        gameLength: options.gameLength || "quick",
        victoryMode: options.victoryMode || "classic",
        maxTurns: options.maxTurns
      }));
    }
  });

  return summarizeResults(results, rules.professions);
}

function simulateGame(options = {}) {
  const professions = options.professions?.length ? options.professions : serializeRules().professions.slice(0, 4).map((item) => item.id);
  const game = createGame(options.roomCode || "SIM01", "Bot 1", professions[0], null, {
    gameLength: options.gameLength || "quick",
    victoryMode: options.victoryMode || "classic",
    maxTurns: options.maxTurns
  });

  for (let index = 1; index < professions.length; index += 1) {
    const player = addPlayer(game, `Bot ${index + 1}`, professions[index]);
    setPlayerReady(game, player.id, true);
  }
  startGame(game, game.hostId);

  const maxSteps = Number(options.maxSteps || Math.max(120, (game.settings.maxTurns || 72) * 3));
  let errors = [];
  for (let step = 0; step < maxSteps && game.status !== "finished"; step += 1) {
    try {
      validateGameState(game);
      playBotDecision(game);
      validateGameState(game);
    } catch (error) {
      errors.push(error.message);
      break;
    }
  }

  const state = serializeGame(game);
  return {
    roomCode: game.roomCode,
    status: game.status,
    winnerId: game.winnerId,
    winnerProfession: state.players.find((player) => player.id === game.winnerId)?.professionId || null,
    finishReason: game.finishReason || null,
    turnCount: game.turnCount || 0,
    round: game.round || 1,
    errors,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      professionId: player.professionId,
      profession: player.profession,
      cash: player.cash,
      passiveIncome: player.passiveIncome,
      projectIncome: player.projectIncome || 0,
      reputation: player.reputation || 0,
      netWorth: playerNetWorth(player),
      track: player.track
    }))
  };
}

function playBotDecision(game) {
  const player = game.players[game.currentPlayerIndex];
  if (!player) {
    throw new Error("Нет текущего игрока.");
  }

  settleDebtIfUseful(game, player);

  if (player.pendingOpportunityChoice) {
    const type = player.cash >= 1800 || player.reputation >= 3 ? "large" : "small";
    drawOpportunity(game, player.id, type);
    return;
  }

  if (player.pendingOpportunity) {
    const card = player.pendingOpportunity;
    const financed = card.loan > 0 && player.cash >= card.downPayment && monthlySurplus(player) - card.payment >= 100;
    if (player.cash >= card.cost) {
      buyOpportunity(game, player.id, "cash");
    } else if (financed) {
      buyOpportunity(game, player.id, "finance");
    } else {
      passOpportunity(game, player.id);
    }
    return;
  }

  if (player.pendingProjectDeal) {
    const deal = player.pendingProjectDeal;
    if (player.cash >= deal.cost && deal.passiveIncome > (deal.upkeep || 0)) {
      buyProjectDeal(game, player.id);
    } else {
      passProjectDeal(game, player.id);
    }
    return;
  }

  if (player.pendingMarketOffer) {
    const offer = player.pendingMarketOffer;
    const asset = player.assets.find((item) => item.id === offer.assetId);
    if (!asset || offer.price >= asset.marketValue || player.cash < 0) {
      acceptMarketOffer(game, player.id);
    } else {
      declineMarketOffer(game, player.id);
    }
    return;
  }

  takeTurn(game, player.id);
}

function settleDebtIfUseful(game, player) {
  const liability = [...player.liabilities].sort((a, b) => b.payment / Math.max(1, b.balance) - a.payment / Math.max(1, a.balance))[0];
  if (!liability) {
    return;
  }
  const reserve = Math.max(1000, player.expenses);
  if (player.cash >= liability.balance + reserve) {
    repayLiability(game, player.id, liability.id);
  }
}

function summarizeResults(results, professions) {
  const byProfession = new Map(professions.map((profession) => [profession.id, {
    id: profession.id,
    title: profession.title,
    games: 0,
    wins: 0,
    totalNetWorth: 0,
    totalTurns: 0
  }]));
  const finishReasons = {};
  const errors = [];

  for (const result of results) {
    if (result.errors.length) {
      errors.push({ roomCode: result.roomCode, errors: result.errors });
    }
    finishReasons[result.finishReason || result.status] = (finishReasons[result.finishReason || result.status] || 0) + 1;
    for (const player of result.players) {
      const row = byProfession.get(player.professionId);
      if (!row) continue;
      row.games += 1;
      row.totalNetWorth += player.netWorth;
      row.totalTurns += result.turnCount;
      if (player.id === result.winnerId) {
        row.wins += 1;
      }
    }
  }

  return {
    games: results.length,
    finished: results.filter((result) => result.status === "finished").length,
    averageTurns: average(results.map((result) => result.turnCount)),
    finishReasons,
    errors,
    professions: [...byProfession.values()].map((row) => ({
      id: row.id,
      title: row.title,
      games: row.games,
      wins: row.wins,
      winRate: row.games ? row.wins / row.games : 0,
      averageNetWorth: row.games ? Math.round(row.totalNetWorth / row.games) : 0,
      averageTurns: row.games ? Math.round(row.totalTurns / row.games) : 0
    })),
    results
  };
}

function withSeededRandom(seed, callback) {
  const originalRandom = Math.random;
  let state = seed >>> 0;
  Math.random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function monthlySurplus(player) {
  return player.salary + player.passiveIncome - player.expenses;
}

function playerNetWorth(player) {
  const assetValue = player.assets.reduce((sum, asset) => sum + (asset.marketValue || asset.cost || 0), 0);
  const liabilities = player.liabilities.reduce((sum, liability) => sum + (liability.balance || 0), 0);
  return player.cash + assetValue - liabilities;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

module.exports = {
  simulateBatch,
  simulateGame
};
