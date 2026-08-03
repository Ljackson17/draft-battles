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

export type Phase = "setup" | "draft" | "reveal";

export interface GameSettings {
  timerSeconds: number;
  scoring: ScoringFormat;
}

export interface GameState {
  phase: Phase;
  settings: GameSettings;
  gmName: string;
  players: GamePlayer[];
  usedPromptIds: number[];
  usedPlayerSeasons: Set<string>;
  slotIndex: number;
  turnOrder: string[];
  currentTurnIndex: number;
  currentPrompt: Prompt | null;
  revealIndex: number;
}
