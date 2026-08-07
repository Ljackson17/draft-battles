import { ROSTER_SLOTS } from "./roster";
import type { GamePlayer, ScoringFormat } from "./types";

export function formatPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function pointsFor(
  format: ScoringFormat,
  fantasyPoints: number,
  fantasyPointsPpr: number,
): number {
  return format === "ppr" ? fantasyPointsPpr : fantasyPoints;
}

export function revealedScore(player: GamePlayer, revealedCount: number): number {
  return ROSTER_SLOTS.slice(0, revealedCount).reduce((sum, slot) => {
    const pick = player.roster[slot];
    return sum + (pick?.points ?? 0);
  }, 0);
}

export function totalScore(player: GamePlayer): number {
  return revealedScore(player, ROSTER_SLOTS.length);
}

/** Match points awarded for 1st/2nd/3rd place on a board; anything lower
 * scores 0. */
export const PLACEMENT_POINTS = [10, 5, 3];

/** Ranks players by score and assigns placement points. Tied players split
 * the average of the placement points their tied ranks span (e.g. a tie
 * for 1st/2nd averages 10 and 5 into 7.5 each). */
export function computePlacementPoints(
  scores: Record<string, number>,
): Record<string, number> {
  const ids = Object.keys(scores);
  const sorted = [...ids].sort((a, b) => scores[b] - scores[a]);
  const result: Record<string, number> = {};

  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j + 1 < sorted.length &&
      scores[sorted[j + 1]] === scores[sorted[i]]
    ) {
      j++;
    }
    const tiedRanks = j - i + 1;
    const pointsForRanks = PLACEMENT_POINTS.slice(i, j + 1);
    while (pointsForRanks.length < tiedRanks) pointsForRanks.push(0);
    const avg =
      pointsForRanks.reduce((a, b) => a + b, 0) / pointsForRanks.length;
    for (let r = i; r <= j; r++) result[sorted[r]] = avg;
    i = j + 1;
  }

  return result;
}
