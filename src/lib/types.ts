export type Position = "QB" | "RB" | "WR" | "TE";

export type ScoringFormat = "standard" | "ppr";

export type RosterSlot =
  | "QB"
  | "RB1"
  | "RB2"
  | "WR1"
  | "WR2"
  | "TE"
  | "FLEX"
  | "SUPERFLEX";

export interface PlayerSeason {
  name: string;
  position: Position;
  team: string;
  season: number;
  games: number;
  fantasyPoints: number;
  fantasyPointsPpr: number;
}

export type RosterPick =
  | {
      status: "filled";
      playerName: string;
      season: number;
      position: Position;
      team: string;
      points: number;
    }
  | {
      status: "brick";
      points: 0;
    };

export interface GamePlayer {
  id: string;
  name: string;
  roster: Partial<Record<RosterSlot, RosterPick>>;
}

export interface Prompt {
  id: number;
  text: string;
}

/** A saved, reusable set of prompts — one per roster slot — so a GM can
 * pre-write an entire game's rounds ahead of time. */
export interface PromptDeck {
  id: string;
  name: string;
  prompts: Record<RosterSlot, string>;
}

export type Phase = "draft" | "reveal";

export interface GameSettings {
  timerSeconds: number;
  scoring: ScoringFormat;
  deckId: string;
}

/** A single board's in-progress or completed draft, nested inside a
 * MatchState. Cross-board/cross-player dedup (usedPlayerNames) lives on
 * the match, not here, since a name can't repeat across the whole match. */
export interface GameState {
  phase: Phase;
  settings: GameSettings;
  gmName: string;
  players: GamePlayer[];
  usedPromptIds: number[];
  slotIndex: number;
  turnOrder: string[];
  currentTurnIndex: number;
  currentPrompt: Prompt | null;
  revealIndex: number;
}

export interface MatchPlayer {
  id: string;
  name: string;
}

/** One completed board's outcome: raw fantasy-point totals plus the match
 * points (10/5/3, ties averaged) that board awarded each player. */
export interface BoardResult {
  deckId: string;
  deckName: string;
  scores: Record<string, number>;
  placementPoints: Record<string, number>;
}

export interface MatchSettings {
  timerSeconds: number;
  scoring: ScoringFormat;
  /** One deck id per board, in play order. */
  deckIds: string[];
}

export type MatchPhase = "setup" | "board" | "complete";

export interface MatchState {
  phase: MatchPhase;
  settings: MatchSettings;
  gmName: string;
  matchPlayers: MatchPlayer[];
  boardIndex: number;
  /** Cumulative match points per player id, updated after each board. */
  standings: Record<string, number>;
  /** Player names already drafted anywhere in the match — a name can only
   * be picked once across all boards. */
  usedPlayerNames: Set<string>;
  boardResults: BoardResult[];
  /** The board currently being drafted/revealed. Null only when phase is
   * "setup" or "complete". */
  game: GameState | null;
}
