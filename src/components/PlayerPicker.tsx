"use client";

import { useMemo, useState } from "react";
import { getSeasonsForPlayer, searchPlayerNames } from "@/lib/playerData";
import type { Position } from "@/lib/types";

interface Props {
  allowedPositions: Position[];
  /** Player names already drafted anywhere in the match — filtered out of
   * search results since a name can only be picked once per match. */
  usedPlayerNames: Set<string>;
  onLockValid: (name: string, season: number) => void;
  onMarkBrick: () => void;
}

export default function PlayerPicker({
  allowedPositions,
  usedPlayerNames,
  onLockValid,
  onMarkBrick,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (selectedName) return [];
    return searchPlayerNames(query, 6, allowedPositions).filter(
      (name) => !usedPlayerNames.has(name),
    );
  }, [query, selectedName, allowedPositions, usedPlayerNames]);

  const seasons = useMemo(() => {
    if (!selectedName) return [];
    return getSeasonsForPlayer(selectedName, allowedPositions);
  }, [selectedName, allowedPositions]);

  const reset = () => {
    setSelectedName(null);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block font-heading text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
          Search player &middot; {allowedPositions.join("/")}
        </label>

        {!selectedName ? (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing a name..."
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
            />
            {suggestions.length > 0 && (
              <ul className="mt-2 divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)]">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      onClick={() => setSelectedName(name)}
                      className="block w-full px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--surface-2)]"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">
                {selectedName}
              </span>
              <button
                onClick={reset}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                change
              </button>
            </div>
            {seasons.length === 0 && (
              <p className="text-sm text-[var(--text-faint)]">
                No eligible seasons for this slot.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {seasons.map((s) => (
                <button
                  key={s.season}
                  onClick={() => {
                    onLockValid(selectedName, s.season);
                    reset();
                  }}
                  title={`${s.team} ${s.position}`}
                  className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-sm text-[var(--text)] transition hover:border-[var(--amber)] hover:bg-[var(--surface-2)]"
                >
                  {s.season}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onMarkBrick}
        className="w-full rounded-lg border border-[color-mix(in_srgb,var(--crimson)_45%,transparent)] bg-[color-mix(in_srgb,var(--crimson)_10%,transparent)] py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-[var(--crimson)] transition hover:bg-[color-mix(in_srgb,var(--crimson)_18%,transparent)]"
      >
        Brick — 0 pts
      </button>
    </div>
  );
}
