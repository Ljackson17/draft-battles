import type { GamePlayer } from "@/lib/types";
import { ROSTER_SLOTS, SLOT_LABELS } from "@/lib/roster";
import { formatPoints, revealedScore } from "@/lib/scoring";
import { teamClass } from "@/lib/teamColors";

interface Props {
  players: GamePlayer[];
  activePlayerId?: string;
  /** Number of slots (from the front of ROSTER_SLOTS) whose points are
   * visible. 0 keeps every score hidden — picks show name/season only. */
  revealedCount: number;
}

export default function TeamBoard({
  players,
  activePlayerId,
  revealedCount,
}: Props) {
  const totals = players.map((p) => revealedScore(p, revealedCount));
  const leadTotal = revealedCount > 0 ? Math.max(...totals) : -1;

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
            className={`${teamClass(i)} relative border-l border-[var(--line)] px-4 py-3 ${
              p.id === activePlayerId ? "team-tint" : ""
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
              <div className="flex flex-col justify-center px-3">
                <span className="font-heading text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  {SLOT_LABELS[slot].split(" ")[0]}
                </span>
              </div>
              {players.map((p) => {
                const pick = p.roster[slot];
                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-center border-l border-[var(--line)] px-4"
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
                      <div className="leading-tight">
                        <p className="truncate font-medium text-[var(--text)]">
                          {pick.playerName}
                        </p>
                        <p className="font-mono text-xs text-[var(--text-muted)]">
                          {pick.season}
                          {revealed ? ` · ${formatPoints(pick.points)} pts` : ""}
                        </p>
                      </div>
                    )}
                  </div>
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
            className={`${teamClass(i)} flex items-center border-l border-[var(--line)] px-4 py-3 ${
              totals[i] === leadTotal ? "team-tint-strong" : ""
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
    </div>
  );
}
