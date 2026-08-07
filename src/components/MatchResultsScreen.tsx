"use client";

import type { BoardResult, MatchPlayer } from "@/lib/types";
import { formatPoints } from "@/lib/scoring";
import { teamClass } from "@/lib/teamColors";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  matchPlayers: MatchPlayer[];
  standings: Record<string, number>;
  boardResults: BoardResult[];
  onNewMatch: () => void;
}

export default function MatchResultsScreen({
  matchPlayers,
  standings,
  boardResults,
  onNewMatch,
}: Props) {
  const order = [...matchPlayers]
    .map((p, i) => ({ p, i, pts: standings[p.id] ?? 0 }))
    .sort((a, b) => b.pts - a.pts);
  const champion = order[0];

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Match complete &middot; {boardResults.length} boards
        </p>
        <h1
          className={`${champion ? teamClass(champion.i) : ""} font-display text-4xl tracking-wide`}
          style={{ color: champion ? "var(--team)" : "var(--amber)" }}
        >
          {champion?.p.name} wins the match
        </h1>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Final standings
        </h2>
        <ul className="flex flex-col gap-1.5">
          {order.map(({ p, i, pts }, rank) => (
            <li
              key={p.id}
              className={`${teamClass(i)} flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2.5 ${
                rank === 0 ? "team-tint" : ""
              }`}
            >
              <span className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-[var(--text)]">
                <span className="font-body">
                  {MEDALS[rank] ?? `${rank + 1}.`}
                </span>
                {p.name}
              </span>
              <span
                className="font-mono text-lg font-semibold"
                style={{ color: rank === 0 ? "var(--team)" : "var(--text)" }}
              >
                {formatPoints(pts)} pts
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Board by board
        </h2>
        <div className="flex flex-col gap-4">
          {boardResults.map((board, boardIdx) => (
            <div key={boardIdx}>
              <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">
                Board {boardIdx + 1} &middot; {board.deckName}
              </p>
              <div className="flex flex-col gap-1">
                {[...matchPlayers]
                  .map((p, i) => ({
                    p,
                    i,
                    score: board.scores[p.id] ?? 0,
                    pts: board.placementPoints[p.id] ?? 0,
                  }))
                  .sort((a, b) => b.score - a.score)
                  .map(({ p, i, score, pts }) => (
                    <div
                      key={p.id}
                      className={`${teamClass(i)} flex items-center justify-between px-1 text-sm`}
                    >
                      <span className="text-[var(--text-muted)]">
                        {p.name}
                      </span>
                      <span className="font-mono text-[var(--text)]">
                        {formatPoints(score)} pts{" "}
                        <span style={{ color: "var(--team)" }}>
                          +{formatPoints(pts)}
                        </span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={onNewMatch}
        className="rounded-xl bg-[var(--amber)] py-4 font-heading text-lg font-bold uppercase tracking-wide text-[#1a1204] transition hover:brightness-110"
      >
        New match
      </button>
    </div>
  );
}
