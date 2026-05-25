import { RatingData, Player, Match } from '../types';

/**
 * Gets the starting ELO rating for a player in a specific tier.
 * In the international ELO system, all active players start with 1000.0 ELO.
 */
export const getInitialEloForPlayerAndTier = (player: Player, tierId: string): number => {
  return 1000.0;
};

/**
 * Core recalculation engine for ELO Ratings using Standard International ELO logic (K = 32):
 * - If a player hasn't played in a tier, their rating is strictly returning "N/A" (undefined / not set).
 * - Minimum ELO score floor for active players is capped at 100.
 * - Standard Elo expectancy calculation is performed.
 * - Symmetrical zero-sum calculation for matchmaking outcomes.
 * - Margin factor based on the close/dominant nature of the set (10:9, 10:8 -> 0.5; 10:7, 10:6 -> 1.0; 10:5 to 10:1 -> 1.5; 10:0 -> 2.0).
 * - Overall rating is the average of played categories.
 */
export function recalculateEloRatings(data: RatingData): RatingData {
  const activeTiers = data.tiers.filter(t => t.id !== 'overall');

  // Deep clone players and matches to maintain purity
  const players: Player[] = data.players.map(p => ({
    ...p,
    eloScores: {},
    history: (p.history || []).map(h => ({ ...h }))
  }));

  const matches: Match[] = (data.matches || []).map(m => ({ ...m }));

  // Identify who has played in which tier
  const playerHasMatchesInTier = new Map<string, Set<string>>(); // playerId -> Set of tierIds

  matches.forEach(m => {
    const tierId = m.tierId || 'axe';
    if (m.player1Id) {
      if (!playerHasMatchesInTier.has(m.player1Id)) {
        playerHasMatchesInTier.set(m.player1Id, new Set());
      }
      playerHasMatchesInTier.get(m.player1Id)!.add(tierId);
    }
    if (m.player2Id) {
      if (!playerHasMatchesInTier.has(m.player2Id)) {
        playerHasMatchesInTier.set(m.player2Id, new Set());
      }
      playerHasMatchesInTier.get(m.player2Id)!.add(tierId);
    }
  });

  // Track dynamic Elo changes step by step
  const currentRatings: Record<string, Record<string, number>> = {};
  players.forEach(p => {
    currentRatings[p.id] = {};
    activeTiers.forEach(t => {
      // Initialize only if they have actually played in this tier
      if (playerHasMatchesInTier.get(p.id)?.has(t.id)) {
        currentRatings[p.id][t.id] = 1000.0;
      }
    });
  });

  // Re-sort matches chronologically, preserving original array index for matches on the same day
  const sortedMatches = matches.map((m, idx) => ({ m, idx })).sort((a, b) => {
    const timeA = new Date(a.m.date).getTime();
    const timeB = new Date(b.m.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.idx - b.idx;
  }).map(item => item.m);

  const matchEloChanges: Record<string, { change1: number; change2: number }> = {};

  sortedMatches.forEach(m => {
    const tierId = m.tierId || 'axe';
    const p1Id = m.player1Id;
    const p2Id = m.player2Id;

    const r1 = currentRatings[p1Id]?.[tierId];
    const r2 = currentRatings[p2Id]?.[tierId];

    // Ensure both players are active in this tier to run calculation
    if (r1 === undefined || r2 === undefined) {
      matchEloChanges[m.id] = { change1: 0, change2: 0 };
      return;
    }

    // Expected score using the classic ELO formula
    const expected1 = 1.0 / (1.0 + Math.pow(10, (r2 - r1) / 400.0));
    const expected2 = 1.0 / (1.0 + Math.pow(10, (r1 - r2) / 400.0));

    // Match outcomes
    const score1 = m.score1 ?? 10;
    const score2 = m.score2 ?? 0;

    let actual1 = 0.5;
    let actual2 = 0.5;
    if (score1 > score2) {
      actual1 = 1.0;
      actual2 = 0.0;
    } else if (score2 > score1) {
      actual1 = 0.0;
      actual2 = 1.0;
    }

    // Margin Factor based on score difference (dampening relative score dynamics)
    const diff = Math.abs(score1 - score2);
    let marginFactor = 1.0;
    if (diff >= 9) {
      marginFactor = 2.0; // 10:0
    } else if (diff >= 5) {
      marginFactor = 1.5; // 10:5 to 10:1
    } else if (diff <= 2) {
      marginFactor = 0.5; // 10:9, 10:8
    } else {
      marginFactor = 1.0; // 10:7, 10:6
    }

    // Underdog protection: if winner was much stronger, we dampen/cancel the margin penalty
    const ratingDifference = Math.abs(r1 - r2);
    if (ratingDifference > 80 && marginFactor > 1.0) {
      marginFactor = 1.0; // dampen elevated penalty to standard
    }
    if (ratingDifference > 150) {
      marginFactor = 0.5; // crush penalty to minimal if discrepancy is major
    }

    const K = 32.0;

    // Delta calculation
    const rawDelta = K * (actual1 - expected1) * marginFactor;
    const delta = Math.round(rawDelta * 10) / 10;

    // Compute original ratings with delta applied
    const nextR1Raw = r1 + delta;
    const nextR2Raw = r2 - delta;

    // Minimum limit / floor capping at 100 ELO
    const nextR1 = Math.max(100.0, nextR1Raw);
    const nextR2 = Math.max(100.0, nextR2Raw);

    // Compute actual displayed modifications
    const finalDelta1 = Math.round((nextR1 - r1) * 10) / 10;
    const finalDelta2 = Math.round((nextR2 - r2) * 10) / 10;

    // Update current records for the transaction sequence
    currentRatings[p1Id][tierId] = nextR1;
    currentRatings[p2Id][tierId] = nextR2;

    matchEloChanges[m.id] = {
      change1: finalDelta1,
      change2: finalDelta2
    };
  });

  // Map the calculated dynamic Elo changes back to the matches array
  const updatedMatches = matches.map(m => {
    const changes = matchEloChanges[m.id];
    return {
      ...m,
      eloChange1: changes ? changes.change1 : 0,
      eloChange2: changes ? changes.change2 : 0
    };
  });

  // Calculate specific and overall ratings for each player
  players.forEach(p => {
    p.eloScores = {};

    let sum = 0;
    let count = 0;

    activeTiers.forEach(t => {
      const rating = currentRatings[p.id]?.[t.id];
      if (rating !== undefined) {
        const rounded = Math.round(rating * 10) / 10;
        p.eloScores![t.id] = rounded;
        sum += rounded;
        count++;
      } else {
        p.eloScores![t.id] = undefined;
      }
    });

    if (count > 0) {
      const avg = sum / count;
      p.elo = Math.round(avg * 10) / 10;
      p.eloScores!['overall'] = p.elo;
    } else {
      p.elo = undefined;
      p.eloScores!['overall'] = undefined;
    }
  });

  return {
    ...data,
    players,
    matches: updatedMatches
  };
}

export function recalculateAll(data: RatingData): RatingData {
  return recalculateEloRatings(data);
}

/**
 * Generates Minecraft-style commentator remarks based on the standard match outcomes
 */
export function generateMinecraftJudgeComment(
  p1Name: string,
  p2Name: string,
  score1: number,
  score2: number,
  change1: number,
  change2: number,
  tierName: string
): string {
  const winnerName = score1 > score2 ? p1Name : (score2 > score1 ? p2Name : null);
  const loserName = score1 > score2 ? p2Name : (score2 > score1 ? p1Name : null);
  const winScore = Math.max(score1, score2);
  const loseScore = Math.min(score1, score2);
  const diff = winScore - loseScore;

  const prefixes = [
    "⚔️ [Судья Арены]",
    "👑 [Судья Арены]",
    "💀 [Судья Арены]",
    "🔥 [Судья Арены]",
    "🔔 [Судья Арены]"
  ];
  const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  if (winnerName && loserName) {
    if (diff === 1 || (winScore === 10 && loseScore === 9)) {
      return `${randPrefix} БИТВА ТИТАНОВ! На арене ${tierName} ${winnerName} вырвал победу у ${loserName} со счётом ${winScore} - ${loseScore}! Это было потрясающее сражение равных по силе воинов: рейтинг игроков почти не изменился, так как они абсолютно равны по уровню! (${winnerName}: [${change1 > 0 ? '+' : ''}${change1}], ${loserName}: [${change2 > 0 ? '+' : ''}${change2}])`;
    }
    if (diff >= 8) {
      return `${randPrefix} ПОЛНЫЙ КРИПЕРДЕФОЛТ! На арене ${tierName} ${winnerName} стер в порошок соперника ${loserName} со счётом ${winScore} - ${loseScore}! ${winnerName} получает ELO [${change1 > 0 ? '+' : ''}${change1}], а поверженный ${loserName} уползает ни с чем [${change2}]!`;
    }
    if (winScore >= 6) {
      return `${randPrefix} ТРУБНЫЙ ЗВУК! На арене ${tierName} ${winnerName} побеждает ${loserName} со счётом ${winScore} - ${loseScore}. ${winnerName} доминирует на арене [${change1 > 0 ? '+' : ''}${change1} ELO], пока ${loserName} грызет незеритовую пыль [${change2} ELO].`;
    }
    return `${randPrefix} Бой окончен! ${winnerName} одолел ${loserName} со счётом ${winScore} - ${loseScore} в категории ${tierName}! ${winnerName} крафтит очки рейтинга [${change1 > 0 ? '+' : ''}${change1}], ${loserName} теряет лишь [${change2}].`;
  } else {
    return `${randPrefix} НИЧЬЯ! На арене ${tierName} ${p1Name} and ${p2Name} сошлись в равном поединке со счётом ${score1} - ${score2}! Оба воина достойны алмазного нагрудника! Рейтинги остаются неизменными!`;
  }
}
