import fs from "fs";
import path from "path";
import type { PromptDeck } from "./types";
import { isDeckComplete } from "./decks";

const DECKS_DIR = path.join(process.cwd(), "src/data/decks");

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

/** Prompt decks committed straight to git as JSON files under
 * src/data/decks/ — drop in a new file (one deck object, or an array of
 * decks) and it's picked up automatically, no code changes needed.
 *
 * Reads the filesystem, so this only works from a Server Component; it
 * can't be imported into "use client" code. */
export function loadBuiltInDecks(): PromptDeck[] {
  const files = fs
    .readdirSync(DECKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const decks: PromptDeck[] = [];
  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(DECKS_DIR, file), "utf-8"),
    );
    const entries = Array.isArray(raw) ? raw : [raw];
    for (const entry of entries) {
      if (isValidDeck(entry)) {
        decks.push(entry);
      } else {
        console.error(`Skipping malformed built-in deck in ${file}:`, entry);
      }
    }
  }
  return decks;
}
