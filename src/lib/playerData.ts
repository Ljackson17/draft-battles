import raw from "@/data/players.json";
import type { Position, PlayerSeason } from "./types";

export const players: PlayerSeason[] = raw as PlayerSeason[];

const byLowerName = new Map<string, PlayerSeason[]>();
const displayNameByLower = new Map<string, string>();

for (const p of players) {
  const key = p.name.toLowerCase();
  displayNameByLower.set(key, p.name);
  const list = byLowerName.get(key);
  if (list) {
    list.push(p);
  } else {
    byLowerName.set(key, [p]);
  }
}

const uniqueLowerNames = Array.from(byLowerName.keys());

function hasEligibleSeason(
  seasons: PlayerSeason[],
  allowedPositions?: Position[],
): boolean {
  if (!allowedPositions) return true;
  return seasons.some((s) => allowedPositions.includes(s.position));
}

export function searchPlayerNames(
  query: string,
  limit = 8,
  allowedPositions?: Position[],
): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const startsWith: string[] = [];
  const includes: string[] = [];
  for (const key of uniqueLowerNames) {
    const seasons = byLowerName.get(key)!;
    if (!hasEligibleSeason(seasons, allowedPositions)) continue;

    if (key.startsWith(q)) {
      startsWith.push(key);
    } else if (key.includes(q)) {
      includes.push(key);
    }
    if (startsWith.length >= limit) break;
  }

  const combined = [...startsWith, ...includes].slice(0, limit);
  return combined.map((k) => displayNameByLower.get(k)!);
}

export function getSeasonsForPlayer(
  name: string,
  allowedPositions?: Position[],
): PlayerSeason[] {
  const list = byLowerName.get(name.trim().toLowerCase());
  if (!list) return [];
  const filtered = allowedPositions
    ? list.filter((p) => allowedPositions.includes(p.position))
    : list;
  return [...filtered].sort((a, b) => b.season - a.season);
}

export function lookupPick(
  name: string,
  season: number,
): PlayerSeason | undefined {
  const list = byLowerName.get(name.trim().toLowerCase());
  return list?.find((p) => p.season === season);
}
