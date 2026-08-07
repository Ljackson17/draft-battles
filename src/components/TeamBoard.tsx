"use client";

import { useState } from "react";
import Image from "next/image";
import type { GamePlayer, RosterSlot } from "@/lib/types";
import {
  ROSTER_SLOTS,
  SLOT_ACCENT,
  SLOT_ELIGIBLE_POSITIONS,
  SLOT_LABELS,
} from "@/lib/roster";
import { formatPoints, revealedScore } from "@/lib/scoring";
import { teamClass } from "@/lib/teamColors";
import { teamLogoUrl } from "@/lib/teamLogos";
import PlayerPicker from "./PlayerPicker";

interface Props {
  players: GamePlayer[];
  activePlayerId?: string;
  /** Number of slots (from the front of ROSTER_SLOTS) whose points are
   * visible. 0 keeps every score hidden — picks show name/season only. */
  revealedCount: number;
  /** Player names already drafted anywhere in the match. */
  usedPlayerNames?: Set<string>;
  /** Presence of these three enables click-to-edit on already-entered
   * picks (misclick fixes). Omit all three to render read-only, as in
   * the reveal phase where scores are mid-reveal. */
  onEditLockValid?: (
    playerId: string,
    slot: RosterSlot,
    name: string,
    season: number,
  ) => void;
  onEditMarkBrick?: (playerId: string, slot: RosterSlot) => void;
  onClearPick?: (playerId: string, slot: RosterSlot) => void;
}

export default function TeamBoard({
  players,
  activePlayerId,
  revealedCount,
  usedPlayerNames = new Set(),
  onEditLockValid,
  onEditMarkBrick,
  onClearPick,
}: Props) {
  const totals = players.map((p) => revealedScore(p, revealedCount));
  const leadTotal = revealedCount > 0 ? Math.max(...totals) : -1;
  const editable = Boolean(onEditLockValid && onEditMarkBrick && onClearPick);

  const [editing, setEditing] = useState<{
    playerId: string;
    slot: RosterSlot;
  } | null>(null);

  const editingPlayer = editing
    ? players.find((p) => p.id === editing.playerId)
    : undefined;
  const editingPick = editing ? editingPlayer?.roster[editing.slot] : undefined;

  const namesExcludingEditingPick = (() => {
    if (!editing || editingPick?.status !== "filled") return usedPlayerNames;
    const withoutOwnPick = new Set(usedPlayerNames);
    withoutOwnPick.delete(editingPick.playerName);
    return withoutOwnPick;
  })();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <div
        className="grid border-b border-[var(--line)]"
        style={{ gridTemplateColumns: `88px repeat(${players.length}, 1fr)` }}
      >
        <div className="flex items-end px-3 py-3">
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
            Slot
          </span>
        </div>
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`${teamClass(i)} relative border-l border-[var(--line)] px-4 py-3 ${p.id === activePlayerId ? "team-tint" : ""
              }`}
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: "var(--team)" }}
            />
            <p className="truncate font-heading text-base font-bold uppercase tracking-wide text-[var(--text)]">
              {p.name}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-evenly">
        {ROSTER_SLOTS.map((slot, slotIdx) => {
          const revealed = slotIdx < revealedCount;
          return (
            <div
              key={slot}
              className="grid flex-1 items-stretch border-b border-[var(--line)] last:border-b-0"
              style={{
                gridTemplateColumns: `88px repeat(${players.length}, 1fr)`,
              }}
            >
              <div
                className="flex flex-col justify-center px-3"
                style={{ borderLeft: `3px solid ${SLOT_ACCENT[slot]}` }}
              >
                <span className="font-heading text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  {SLOT_LABELS[slot].split(" ")[0]}
                </span>
              </div>
              {players.map((p) => {
                const pick = p.roster[slot];
                const canEdit = editable && Boolean(pick);
                const logoUrl =
                  pick?.status === "filled" ? teamLogoUrl(pick.team) : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEditing({ playerId: p.id, slot })}
                    title={canEdit ? "Fix this pick" : undefined}
                    className={`flex flex-col justify-center border-l border-[var(--line)] px-4 text-left ${canEdit ? "cursor-pointer hover:bg-[var(--surface-2)]" : "cursor-default"
                      }`}
                  >
                    {!pick && (
                      <span className="text-[var(--text-faint)]">—</span>
                    )}
                    {pick?.status === "brick" && (
                      <span className="text-sm text-[var(--crimson)] line-through decoration-[var(--crimson)]/70">
                        Ineligible
                      </span>
                    )}
                    {pick?.status === "filled" && (
                      <div className="flex items-center gap-2 leading-tight">
                        {logoUrl && (
                          <Image
                            src={logoUrl}
                            alt=""
                            width={20}
                            height={20}
                            className="shrink-0 object-contain"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text)]">
                            {pick.playerName}
                          </p>
                          <p className="font-mono text-xs text-[var(--text-muted)]">
                            {pick.season}
                            {revealed
                              ? ` · ${formatPoints(pick.points)} pts`
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        className="grid border-t border-[var(--line)] bg-[var(--surface-2)]"
        style={{ gridTemplateColumns: `88px repeat(${players.length}, 1fr)` }}
      >
        <div className="flex items-center px-3 py-3">
          <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faint)]">
            Total
          </span>
        </div>
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`${teamClass(i)} flex items-center border-l border-[var(--line)] px-4 py-3 ${totals[i] === leadTotal ? "team-tint-strong" : ""
              }`}
          >
            <span
              className="font-mono text-2xl font-semibold"
              style={{
                color: totals[i] === leadTotal ? "var(--team)" : "var(--text)",
              }}
            >
              {revealedCount > 0 ? formatPoints(totals[i]) : "—"}
            </span>
          </div>
        ))}
      </div>

      {editing && editingPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--amber)]">
                  Fix pick &middot; {SLOT_LABELS[editing.slot]}
                </p>
                <p className="font-display text-lg tracking-wide text-[var(--text)]">
                  {editingPlayer.name}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Close
              </button>
            </div>

            <PlayerPicker
              allowedPositions={SLOT_ELIGIBLE_POSITIONS[editing.slot]}
              usedPlayerNames={namesExcludingEditingPick}
              onLockValid={(name, season) => {
                onEditLockValid?.(editing.playerId, editing.slot, name, season);
                setEditing(null);
              }}
              onMarkBrick={() => {
                onEditMarkBrick?.(editing.playerId, editing.slot);
                setEditing(null);
              }}
            />

            <button
              onClick={() => {
                onClearPick?.(editing.playerId, editing.slot);
                setEditing(null);
              }}
              className="mt-3 w-full rounded-lg border border-[var(--line)] py-2.5 font-heading text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--text-faint)]"
            >
              Clear pick (leave empty)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
