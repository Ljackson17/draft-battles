"use client";

import { useState } from "react";
import type { PromptDeck } from "@/lib/types";
import { ROSTER_SLOTS, SLOT_LABELS } from "@/lib/roster";
import { emptyDeckPrompts, isDeckComplete } from "@/lib/decks";

interface Props {
  initialDeck?: PromptDeck;
  onSave: (deck: PromptDeck) => void;
  onCancel: () => void;
}

export default function PromptDeckEditor({
  initialDeck,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialDeck?.name ?? "");
  const [prompts, setPrompts] = useState<string[]>(
    initialDeck?.prompts ?? emptyDeckPrompts(),
  );

  const updatePrompt = (i: number, value: string) => {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  };

  const canSave = name.trim().length > 0 && isDeckComplete(prompts);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--amber)] bg-[var(--bg)] p-5">
      <div>
        <label className="mb-1.5 block font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Deck name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Trivia Pack"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
        />
      </div>

      <div className="flex flex-col gap-3">
        {ROSTER_SLOTS.map((slot, i) => (
          <div key={slot}>
            <label className="mb-1 block font-heading text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
              Round {i + 1} &middot; {SLOT_LABELS[slot]}
            </label>
            <textarea
              value={prompts[i]}
              onChange={(e) => updatePrompt(i, e.target.value)}
              rows={2}
              placeholder="What must the pick satisfy?"
              className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: initialDeck?.id ?? crypto.randomUUID(),
              name: name.trim(),
              prompts: prompts.map((p) => p.trim()),
            })
          }
          className="flex-1 rounded-lg bg-[var(--amber)] py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-[#1a1204] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save deck
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-[var(--line)] py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-[var(--text)] transition hover:border-[var(--text-faint)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
