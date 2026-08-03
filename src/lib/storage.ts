import type { GameState, PromptDeck } from "./types";

const GAME_KEY = "draft-battles:game:v1";
const DECKS_KEY = "draft-battles:decks:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveGameState(state: GameState) {
  if (!isBrowser()) return;
  try {
    const serializable = {
      ...state,
      usedPlayerSeasons: Array.from(state.usedPlayerSeasons),
    };
    window.localStorage.setItem(GAME_KEY, JSON.stringify(serializable));
  } catch {
    // localStorage unavailable (private browsing, quota) — drop silently
  }
}

export function loadGameState(): GameState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.phase !== "string" ||
      !Array.isArray(parsed.players)
    ) {
      return null;
    }
    return {
      ...parsed,
      usedPlayerSeasons: new Set<string>(parsed.usedPlayerSeasons ?? []),
    } as GameState;
  } catch {
    return null;
  }
}

export function clearGameState() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(GAME_KEY);
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
