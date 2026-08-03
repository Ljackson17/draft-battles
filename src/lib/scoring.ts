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
