import type { Position, RosterSlot } from "./types";

export const ROSTER_SLOTS: RosterSlot[] = [
  "QB",
  "RB1",
  "RB2",
  "WR1",
  "WR2",
  "TE",
  "FLEX",
  "SUPERFLEX",
];

export const SLOT_ELIGIBLE_POSITIONS: Record<RosterSlot, Position[]> = {
  QB: ["QB"],
  RB1: ["RB"],
  RB2: ["RB"],
  WR1: ["WR"],
  WR2: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  SUPERFLEX: ["QB", "RB", "WR", "TE"],
};

export const SLOT_LABELS: Record<RosterSlot, string> = {
  QB: "QB",
  RB1: "RB",
  RB2: "RB",
  WR1: "WR",
  WR2: "WR",
  TE: "TE",
  FLEX: "FLEX (RB/WR/TE)",
  SUPERFLEX: "SUPERFLEX (Any)",
};
