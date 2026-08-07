import type { MatchState, PromptDeck } from "./types";

const MATCH_KEY = "draft-battles:match:v2";
const DECKS_KEY = "draft-battles:decks:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveMatchState(state: MatchState) {
  if (!isBrowser()) return;
  try {
    const serializable = {
      ...state,
      usedPlayerNames: Array.from(state.usedPlayerNames),
    };
    window.localStorage.setItem(MATCH_KEY, JSON.stringify(serializable));
  } catch {
    // localStorage unavailable (private browsing, quota) — drop silently
  }
}

export function loadMatchState(): MatchState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(MATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.phase !== "string" ||
      !Array.isArray(parsed.matchPlayers)
    ) {
      return null;
    }
    return {
      ...parsed,
      usedPlayerNames: new Set<string>(parsed.usedPlayerNames ?? []),
    } as MatchState;
  } catch {
    return null;
  }
}

export function clearMatchState() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(MATCH_KEY);
}

export function saveDecks(decks: PromptDeck[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch {
    // ignore
  }
}

export function loadDecks(): PromptDeck[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
