import { ROSTER_SLOTS } from "./roster";

/** Sentinel deckId meaning "draw randomly from the built-in prompt pool",
 * rather than an id of a saved PromptDeck. */
export const RANDOM_DECK_ID = "random";

export function emptyDeckPrompts(): string[] {
  return ROSTER_SLOTS.map(() => "");
}

export function isDeckComplete(prompts: string[]): boolean {
  return (
    prompts.length === ROSTER_SLOTS.length &&
    prompts.every((p) => p.trim().length > 0)
  );
}
