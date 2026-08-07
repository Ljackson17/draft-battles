"use client";

import { useState } from "react";
import type { MatchSettings, PromptDeck } from "@/lib/types";
import { ROSTER_SLOTS, SLOT_LABELS } from "@/lib/roster";
import { RANDOM_DECK_ID } from "@/lib/decks";
import { BOARDS_PER_MATCH } from "@/lib/match";
import { teamClass } from "@/lib/teamColors";
import PromptDeckEditor from "./PromptDeckEditor";

interface Props {
  onStart: (
    playerNames: string[],
    gmName: string,
    settings: MatchSettings,
  ) => void;
  builtInDecks: PromptDeck[];
  customDecks: PromptDeck[];
  onCreateDeck: (deck: PromptDeck) => void;
  onUpdateDeck: (deck: PromptDeck) => void;
  onDeleteDeck: (id: string) => void;
}

export default function SetupScreen({
  onStart,
  builtInDecks,
  customDecks,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
}: Props) {
  const [gmName, setGmName] = useState("");
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [scoring, setScoring] = useState<"standard" | "ppr">("ppr");
  const [deckIds, setDeckIds] = useState<string[]>(
    Array(BOARDS_PER_MATCH).fill(RANDOM_DECK_ID),
  );
  const [editingDeck, setEditingDeck] = useState<"new" | PromptDeck | null>(
    null,
  );

  const updateDeckId = (boardIdx: number, id: string) =>
    setDeckIds((prev) => prev.map((d, idx) => (idx === boardIdx ? id : d)));

  const updateName = (i: number, value: string) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  };

  const addPlayer = () => setNames((prev) => [...prev, ""]);
  const removePlayer = (i: number) =>
    setNames((prev) => prev.filter((_, idx) => idx !== i));

  const trimmed = names.map((n) => n.trim());
  const validNames = trimmed.filter((n) => n.length > 0);
  const hasDupes =
    new Set(validNames.map((n) => n.toLowerCase())).size !== validNames.length;
  const canStart = validNames.length >= 1 && !hasDupes;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="font-display text-5xl tracking-wide text-[var(--amber)]">
          DRAFT BATTLES
        </h1>
        <p className="mt-2 max-w-md text-[var(--text-muted)]">
          A match is {BOARDS_PER_MATCH} boards of an {ROSTER_SLOTS.length}-slot
          fantasy roster off prompts, scored on real NFL stats from
          1970&ndash;2025. Each board&apos;s top 3 score 10/5/3 match points;
          most match points after {BOARDS_PER_MATCH} boards wins. A player
          name can only be drafted once across the whole match. A Game
          Master runs the board.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Game Master
        </h2>
        <input
          value={gmName}
          onChange={(e) => setGmName(e.target.value)}
          placeholder="Who's running the board? (optional)"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
        />
        <p className="mt-2 text-xs text-[var(--text-faint)]">
          The GM enters every pick and judges it against the prompt &mdash; they
          don&apos;t draft a roster themselves.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Drafters
        </h2>
        <div className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className={`${teamClass(i)} flex items-center gap-2`}>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: "var(--team)" }}
              />
              <input
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Team ${i + 1}`}
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
              />
              {names.length > 2 && (
                <button
                  onClick={() => removePlayer(i)}
                  className="rounded-lg border border-[var(--line)] px-3 py-2.5 text-[var(--text-muted)] hover:border-[var(--crimson)] hover:text-[var(--crimson)]"
                  aria-label="Remove player"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {hasDupes && (
          <p className="mt-2 text-sm text-[var(--crimson)]">
            Team names must be unique.
          </p>
        )}
        {names.length < 5 && (
          <button
            onClick={addPlayer}
            className="mt-3 font-heading text-sm font-semibold uppercase tracking-wide text-[var(--amber)] hover:brightness-110"
          >
            + Add team
          </button>
        )}
        {names.length > 3 && (
          <p className="mt-2 text-xs text-[var(--text-faint)]">
            More than 3? Pair up as partners under one team name for the
            cleanest board.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Roster &middot; {ROSTER_SLOTS.length} rounds
        </h2>
        <p className="font-mono text-sm text-[var(--text-muted)]">
          {ROSTER_SLOTS.map((s) => SLOT_LABELS[s]).join("  ·  ")}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-1 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Prompt decks &middot; {BOARDS_PER_MATCH} boards
        </h2>
        <p className="mb-3 text-xs text-[var(--text-faint)]">
          Pick a deck for each board of the match, in order. Use the
          built-in random pool, or write your own deck below.
        </p>

        <div className="flex flex-col gap-2">
          {deckIds.map((id, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-heading text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                Board {i + 1}
              </span>
              <select
                value={id}
                onChange={(e) => updateDeckId(i, e.target.value)}
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--amber)]"
              >
                <option value={RANDOM_DECK_ID}>🎲 Random mix</option>
                {builtInDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
                {customDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {customDecks.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--line)] pt-4">
            {customDecks.map((deck) => (
              <div key={deck.id} className="flex items-center gap-2">
                <span className="flex-1 truncate font-heading text-sm font-semibold uppercase tracking-wide text-[var(--text)]">
                  {deck.name}
                </span>
                <button
                  onClick={() => setEditingDeck(deck)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--amber)]"
                >
                  edit
                </button>
                <button
                  onClick={() => {
                    setDeckIds((prev) =>
                      prev.map((d) => (d === deck.id ? RANDOM_DECK_ID : d)),
                    );
                    onDeleteDeck(deck.id);
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--crimson)]"
                >
                  delete
                </button>
              </div>
            ))}
          </div>
        )}

        {editingDeck ? (
          <div className="mt-3">
            <PromptDeckEditor
              initialDeck={editingDeck === "new" ? undefined : editingDeck}
              onSave={(deck) => {
                if (editingDeck === "new") {
                  onCreateDeck(deck);
                } else {
                  onUpdateDeck(deck);
                }
                setEditingDeck(null);
              }}
              onCancel={() => setEditingDeck(null)}
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingDeck("new")}
            className="mt-3 font-heading text-sm font-semibold uppercase tracking-wide text-[var(--amber)] hover:brightness-110"
          >
            + New prompt deck
          </button>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <label className="mb-2 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Seconds per pick
          </label>
          <input
            type="number"
            min={10}
            max={90}
            step={5}
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 font-mono text-[var(--text)] outline-none focus:border-[var(--amber)]"
          />
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <label className="mb-2 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Scoring
          </label>
          <div className="flex gap-2">
            {(["ppr", "standard"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setScoring(fmt)}
                className={`flex-1 rounded-lg border py-2 font-heading text-sm font-bold uppercase tracking-wide transition ${
                  scoring === fmt
                    ? "border-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] text-[var(--amber)]"
                    : "border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--text-faint)]"
                }`}
              >
                {fmt === "ppr" ? "PPR" : "Standard"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button
        disabled={!canStart}
        onClick={() =>
          onStart(validNames, gmName.trim(), {
            timerSeconds,
            scoring,
            deckIds,
          })
        }
        className="rounded-xl bg-[var(--amber)] py-4 font-heading text-lg font-bold uppercase tracking-wide text-[#1a1204] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start Match
      </button>
    </div>
  );
}
