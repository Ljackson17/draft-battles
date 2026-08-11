import sleeperAvatars from "@/data/sleeperAvatars.json";

const AVATARS: Record<string, string> = sleeperAvatars;

/**
 * Sleeper's headshot CDN, keyed by their own player_id (mapped from our
 * player names offline — see scripts/build_sleeper_avatars.py). Sleeper's
 * player database only goes back to roughly the 2000s, so most pre-2000
 * seasons have no match and this returns null.
 */
export function playerAvatarUrl(name: string): string | null {
  const id = AVATARS[name];
  if (!id) return null;
  return `https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg`;
}
