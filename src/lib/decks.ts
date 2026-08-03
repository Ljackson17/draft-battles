import type { RosterSlot } from "./types";
import { ROSTER_SLOTS } from "./roster";

/** Sentinel deckId meaning "draw randomly from the built-in prompt pool",
 * rather than an id of a saved PromptDeck. */
export const RANDOM_DECK_ID = "random";

export function emptyDeckPrompts(): Record<RosterSlot, string> {
  return Object.fromEntries(ROSTER_SLOTS.map((slot) => [slot, ""])) as Record<
    RosterSlot,
    string
  >;
}

export function isDeckComplete(
  prompts: Partial<Record<RosterSlot, string>>,
): boolean {
  return ROSTER_SLOTS.every((slot) => (prompts[slot] ?? "").trim().length > 0);
}
