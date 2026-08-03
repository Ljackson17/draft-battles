import type { PromptDeck } from "./types";
import { isDeckComplete } from "./decks";
import raw from "@/data/builtInDecks.json";

function isValidDeck(deck: unknown): deck is PromptDeck {
  const d = deck as Partial<PromptDeck> | null;
  return (
    !!d &&
    typeof d.id === "string" &&
    d.id.length > 0 &&
    typeof d.name === "string" &&
    d.name.length > 0 &&
    !!d.prompts &&
    typeof d.prompts === "object" &&
    !Array.isArray(d.prompts) &&
    isDeckComplete(d.prompts)
  );
}

/** Prompt decks committed straight to git (src/data/builtInDecks.json) so
 * anyone can add a deck via PR without touching app code. Loaded once at
 * build time; a malformed entry is dropped with a console warning instead
 * of crashing the app for everyone. */
export const BUILT_IN_DECKS: PromptDeck[] = (raw as unknown[]).filter(
  (deck): deck is PromptDeck => {
    if (isValidDeck(deck)) return true;
    console.error("Skipping malformed built-in deck:", deck);
    return false;
  },
);
