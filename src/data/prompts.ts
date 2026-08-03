import type { Prompt, PromptDeck } from "@/lib/types";
import { RANDOM_DECK_ID } from "@/lib/decks";

// BDGE-style draft prompts. Legality of a pick against the prompt is judged
// by the group (honor system) — the app only handles scoring once a
// player + season has been locked in.
const PROMPT_TEXTS: string[] = [
  "RB with a 1,000-yard rushing season — but not in the year you draft him",
  "WR with a 1,000-yard receiving teammate that same season",
  "Player who had a return touchdown the same season you choose",
  "QB who was drafted on Day 3 (rounds 4-7) — can't be a name everyone knows",
  "Player who has thrown an interception (any position)",
  "Player whose first or last name has no letter S in it",
  "TE whose first name is longer than their last name",
  "Player who has been to actual prison",
  "Player who held out for a new contract at some point in their career",
  "Player who went to a MAC (Mid-American Conference) school",
  "Player who ran a 40-yard dash slower than 4.70",
  "Player who tore their ACL at some point in their career",
  "RB2 on a team — rival college of your RB2's school",
  "Player who was on their third team in the year you choose",
  "Player who has completed a pass (non-QB)",
  "Kicker — you must name that team's Week 1 starting QB for the year taken",
  "Player must be able to name the team's Week 1 kicker for the year taken",
  "Player who played quarterback at some point in high school or college",
  "WR/TE who was a former college quarterback",
  "Player who has caught a touchdown from a non-QB passer (trick play)",
  "RB who had a 1,000-yard receiving season (any year)",
  "Player who was a Pro Bowler in the year you choose",
  "Player who was undrafted out of college",
  "Player who was drafted in the first round but bricked as a bust",
  "Player who has a Super Bowl ring",
  "Player who switched positions at some point in their career",
  "Player who wore #1 for a season",
  "Player over 6'5\" (any offensive skill position)",
  "Player under 5'10\" (any offensive skill position)",
  "Player who went to the same college as your last pick",
  "Player who has over 3 kids",
  "Player whose rookie season was also their best season",
  "Player who had a season-ending injury in Week 1",
  "Player who scored a touchdown longer than 80 yards that season",
  "Player who played for a Canadian or European league before/after the NFL",
  "Player who has a brother who also played in the NFL",
  "Player who never made a Pro Bowl but had a 1,000-yard season",
  "Player whose team made the playoffs that season",
  "Player whose team went 0-16 or had a losing record that season",
  "Player who was a college walk-on",
  "Player who has over 15 career fumbles",
  "Player who caught a two-point conversion that season",
  "Player who was traded mid-season during the year you choose",
  "Player who has a nickname longer than their real name",
  "Player who wore glasses or contacts on the field",
  "Player from a state that doesn't touch an ocean",
  "Player who has appeared in a Madden cover or commercial",
];

export const PROMPTS: Prompt[] = PROMPT_TEXTS.map((text, i) => ({
  id: i + 1,
  text,
}));

export function drawPrompt(usedIds: number[]): Prompt {
  const available = PROMPTS.filter((p) => !usedIds.includes(p.id));
  const pool = available.length > 0 ? available : PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Resolves the prompt for a given round. A custom deck supplies a fixed
 * prompt per slot index; the "random" deck falls back to drawPrompt's
 * no-repeat pool draw. */
export function promptForSlot(
  deckId: string,
  decks: PromptDeck[],
  slotIndex: number,
  usedPromptIds: number[],
): { prompt: Prompt; usedPromptIds: number[] } {
  if (deckId !== RANDOM_DECK_ID) {
    const deck = decks.find((d) => d.id === deckId);
    const text = deck?.prompts[slotIndex]?.trim();
    if (text) {
      return { prompt: { id: -(slotIndex + 1), text }, usedPromptIds };
    }
  }
  const prompt = drawPrompt(usedPromptIds);
  return { prompt, usedPromptIds: [...usedPromptIds, prompt.id] };
}
