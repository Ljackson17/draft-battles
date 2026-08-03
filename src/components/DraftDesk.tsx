"use client";

import { useEffect, useState } from "react";
import type { GamePlayer, Prompt, RosterSlot } from "@/lib/types";
import {
  ROSTER_SLOTS,
  SLOT_ELIGIBLE_POSITIONS,
  SLOT_LABELS,
} from "@/lib/roster";
import { teamClass } from "@/lib/teamColors";
import { formatPoints, totalScore } from "@/lib/scoring";
import PlayClock from "./PlayClock";
import PlayerPicker from "./PlayerPicker";
import TeamBoard from "./TeamBoard";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  phase: "draft" | "reveal";
  players: GamePlayer[];
  slotIndex: number;
  prompt: Prompt | null;
  turnOrder: string[];
  currentTurnIndex: number;
  timerSeconds: number;
  usedPlayerSeasons: Set<string>;
  gmName: string;
  revealIndex: number;
  onLockValid: (name: string, season: number) => void;
  onMarkBrick: () => void;
  onRevealNext: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export default function DraftDesk({
  phase,
  players,
  slotIndex,
  prompt,
  turnOrder,
  currentTurnIndex,
  timerSeconds,
  usedPlayerSeasons,
  gmName,
  revealIndex,
  onLockValid,
  onMarkBrick,
  onRevealNext,
  onPlayAgain,
  onNewGame,
}: Props) {
  const draftSlot: RosterSlot = ROSTER_SLOTS[slotIndex];
  const activePlayerId = turnOrder[currentTurnIndex];
  const activePlayerIndex = players.findIndex((p) => p.id === activePlayerId);
  const activePlayer = players[activePlayerIndex];

  const revealDone = revealIndex >= ROSTER_SLOTS.length;
  const revealSlot = !revealDone ? ROSTER_SLOTS[revealIndex] : null;

  const order = [...players]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => totalScore(b.p) - totalScore(a.p));
  const winner = order[0];

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-xl tracking-wide text-[var(--amber)]">
            DRAFT BATTLES
          </h1>
          <span className="font-heading text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {phase === "draft" &&
              `Slot ${slotIndex + 1} / ${ROSTER_SLOTS.length} — ${SLOT_LABELS[draftSlot]}`}
            {phase === "reveal" &&
              (revealDone
                ? "Final results"
                : `Revealing ${revealIndex + 1} / ${ROSTER_SLOTS.length} — ${SLOT_LABELS[revealSlot!]}`)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {gmName && (
            <span className="font-heading text-sm uppercase tracking-wide text-[var(--text-muted)]">
              GM &middot; <span className="text-[var(--text)]">{gmName}</span>
            </span>
          )}
          <button
            onClick={() => {
              if (
                phase === "reveal" ||
                window.confirm(
                  "Leave this draft and go back to the home screen? Current progress will be lost.",
                )
              ) {
                onNewGame();
              }
            }}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--text-faint)]"
          >
            Home
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr_320px] gap-4 p-4">
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          {phase === "draft" && prompt && (
            <>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--amber)]">
                {SLOT_LABELS[draftSlot]} Prompt
              </p>
              <p className="text-2xl leading-snug font-semibold text-[var(--text)]">
                {prompt.text}
              </p>
            </>
          )}

          {phase === "reveal" && !revealDone && (
            <>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--amber)]">
                Revealing
              </p>
              <p className="text-2xl leading-snug font-semibold text-[var(--text)]">
                How&apos;d {SLOT_LABELS[revealSlot!]} shake out?
              </p>
            </>
          )}

          {phase === "reveal" && revealDone && (
            <>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Draft complete
              </p>
              <p
                className={`${winner ? teamClass(winner.i) : ""} font-display text-3xl leading-tight tracking-wide`}
                style={{ color: winner ? "var(--team)" : "var(--text)" }}
              >
                {winner?.p.name} wins
              </p>
              <ul className="flex flex-col gap-1.5">
                {order.map(({ p, i }, rank) => (
                  <li
                    key={p.id}
                    className={`${teamClass(i)} flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 ${
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
                      className="font-mono text-base font-semibold"
                      style={{ color: rank === 0 ? "var(--team)" : "var(--text)" }}
                    >
                      {formatPoints(totalScore(p))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!(phase === "reveal" && revealDone) && (
            <div className="mt-auto flex flex-col gap-2 border-t border-[var(--line)] pt-4">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className={`${teamClass(i)} flex items-center gap-2`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: "var(--team)" }}
                  />
                  <span className="truncate font-heading text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="min-h-0">
          <TeamBoard
            players={players}
            activePlayerId={phase === "draft" ? activePlayerId : undefined}
            revealedCount={phase === "reveal" ? revealIndex : 0}
          />
        </main>

        <aside className="flex min-h-0 flex-col overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          {phase === "draft" && activePlayer && (
            <PickPanel
              key={`${slotIndex}-${currentTurnIndex}`}
              activePlayer={activePlayer}
              activePlayerIndex={activePlayerIndex}
              slot={draftSlot}
              timerSeconds={timerSeconds}
              usedPlayerSeasons={usedPlayerSeasons}
              onLockValid={onLockValid}
              onMarkBrick={onMarkBrick}
            />
          )}

          {phase === "reveal" && !revealDone && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Next up
              </p>
              <p className="font-display text-3xl tracking-wide text-[var(--amber)]">
                {SLOT_LABELS[revealSlot!]}
              </p>
              <button
                onClick={onRevealNext}
                className="w-full rounded-xl bg-[var(--amber)] py-4 font-heading text-lg font-bold uppercase tracking-wide text-[#1a1204] transition hover:brightness-110"
              >
                Reveal
              </button>
            </div>
          )}

          {phase === "reveal" && revealDone && (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <button
                onClick={onPlayAgain}
                className="rounded-xl bg-[var(--amber)] py-3.5 font-heading text-base font-bold uppercase tracking-wide text-[#1a1204] transition hover:brightness-110"
              >
                Play again
              </button>
              <button
                onClick={onNewGame}
                className="rounded-xl border border-[var(--line)] py-3.5 font-heading text-base font-bold uppercase tracking-wide text-[var(--text)] transition hover:border-[var(--text-faint)]"
              >
                New game
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function PickPanel({
  activePlayer,
  activePlayerIndex,
  slot,
  timerSeconds,
  usedPlayerSeasons,
  onLockValid,
  onMarkBrick,
}: {
  activePlayer: GamePlayer;
  activePlayerIndex: number;
  slot: RosterSlot;
  timerSeconds: number;
  usedPlayerSeasons: Set<string>;
  onLockValid: (name: string, season: number) => void;
  onMarkBrick: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [isPaused, setIsPaused] = useState(false);

  const expired = timeLeft === 0;

  useEffect(() => {
    if (isPaused || expired) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, expired]);

  const togglePause = () => setIsPaused((p) => !p);
  const restartClock = () => {
    setTimeLeft(timerSeconds);
    setIsPaused(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div
        className={`${teamClass(activePlayerIndex)} team-tint flex items-center gap-3 rounded-lg border-l-4 px-4 py-3`}
        style={{ borderColor: "var(--team)" }}
      >
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            On the clock
          </p>
          <p
            className="font-display text-2xl tracking-wide"
            style={{ color: "var(--team)" }}
          >
            {activePlayer.name}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <PlayClock timeLeft={timeLeft} totalTime={timerSeconds} />
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            disabled={expired}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--text-faint)] disabled:opacity-40"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={restartClock}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--text-faint)]"
          >
            Restart
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-faint)]">
        {expired
          ? "Time's up — call it a pick or a brick when ready."
          : "Enter the pick they call out, or mark it a brick if it doesn't satisfy the prompt. Picks hit the board immediately."}
      </p>

      <PlayerPicker
        allowedPositions={SLOT_ELIGIBLE_POSITIONS[slot]}
        usedPlayerSeasons={usedPlayerSeasons}
        onLockValid={onLockValid}
        onMarkBrick={onMarkBrick}
      />
    </div>
  );
}
