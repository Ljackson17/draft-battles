"use client";

import { useState } from "react";
import type { GamePlayer, GameSettings, GameState, RosterPick } from "@/lib/types";
import { ROSTER_SLOTS } from "@/lib/roster";
import { drawPrompt } from "@/data/prompts";
import { lookupPick } from "@/lib/playerData";
import { pointsFor } from "@/lib/scoring";
import SetupScreen from "@/components/SetupScreen";
import DraftDesk from "@/components/DraftDesk";

const DEFAULT_SETTINGS: GameSettings = {
  timerSeconds: 30,
  scoring: "ppr",
};

function initialState(): GameState {
  return {
    phase: "setup",
    settings: DEFAULT_SETTINGS,
    gmName: "",
    players: [],
    usedPromptIds: [],
    usedPlayerSeasons: new Set(),
    slotIndex: 0,
    turnOrder: [],
    currentTurnIndex: 0,
    currentPrompt: null,
    revealIndex: 0,
  };
}

export default function Home() {
  const [state, setState] = useState<GameState>(initialState);

  const startGame = (
    names: string[],
    gmName: string,
    settings: GameSettings,
  ) => {
    const players: GamePlayer[] = names.map((name) => ({
      id: crypto.randomUUID(),
      name,
      roster: {},
    }));
    const prompt = drawPrompt([]);
    setState({
      phase: "draft",
      settings,
      gmName,
      players,
      usedPromptIds: [prompt.id],
      usedPlayerSeasons: new Set(),
      slotIndex: 0,
      turnOrder: players.map((p) => p.id),
      currentTurnIndex: 0,
      currentPrompt: prompt,
      revealIndex: 0,
    });
  };

  /** Applies a pick to the current player's roster immediately, then
   * advances the turn — or, if that was the slot's last pick, rolls the
   * whole game over to the next slot (new prompt, rotated turn order). */
  const applyPick = (pick: RosterPick) => {
    setState((prev) => {
      const slot = ROSTER_SLOTS[prev.slotIndex];
      const currentPlayerId = prev.turnOrder[prev.currentTurnIndex];
      const players = prev.players.map((p) =>
        p.id === currentPlayerId
          ? { ...p, roster: { ...p.roster, [slot]: pick } }
          : p,
      );
      const usedPlayerSeasons = new Set(prev.usedPlayerSeasons);
      if (pick.status === "filled") {
        usedPlayerSeasons.add(`${pick.playerName}|${pick.season}`);
      }

      const nextTurnIndex = prev.currentTurnIndex + 1;
      if (nextTurnIndex < prev.turnOrder.length) {
        return {
          ...prev,
          players,
          usedPlayerSeasons,
          currentTurnIndex: nextTurnIndex,
        };
      }

      const nextSlotIndex = prev.slotIndex + 1;
      if (nextSlotIndex >= ROSTER_SLOTS.length) {
        return {
          ...prev,
          players,
          usedPlayerSeasons,
          phase: "reveal" as const,
          revealIndex: 0,
        };
      }

      const rotatedTurnOrder = [...prev.turnOrder.slice(1), prev.turnOrder[0]];
      const nextPrompt = drawPrompt(prev.usedPromptIds);

      return {
        ...prev,
        players,
        usedPlayerSeasons,
        slotIndex: nextSlotIndex,
        turnOrder: rotatedTurnOrder,
        currentTurnIndex: 0,
        currentPrompt: nextPrompt,
        usedPromptIds: [...prev.usedPromptIds, nextPrompt.id],
      };
    });
  };

  const lockValidPick = (name: string, season: number) => {
    const found = lookupPick(name, season);
    if (!found) return;
    const points = pointsFor(
      state.settings.scoring,
      found.fantasyPoints,
      found.fantasyPointsPpr,
    );
    applyPick({
      status: "filled",
      playerName: name,
      season,
      position: found.position,
      team: found.team,
      points,
    });
  };

  const markBrick = () => applyPick({ status: "brick", points: 0 });
  const handleTimeout = () => applyPick({ status: "brick", points: 0 });

  const revealNext = () => {
    setState((prev) => ({
      ...prev,
      revealIndex: Math.min(prev.revealIndex + 1, ROSTER_SLOTS.length),
    }));
  };

  const playAgain = () => {
    setState((prev) => {
      const players = prev.players.map((p) => ({ ...p, roster: {} }));
      const prompt = drawPrompt([]);
      return {
        phase: "draft",
        settings: prev.settings,
        gmName: prev.gmName,
        players,
        usedPromptIds: [prompt.id],
        usedPlayerSeasons: new Set(),
        slotIndex: 0,
        turnOrder: players.map((p) => p.id),
        currentTurnIndex: 0,
        currentPrompt: prompt,
        revealIndex: 0,
      };
    });
  };

  const newGame = () => setState(initialState());

  if (state.phase === "setup") {
    return <SetupScreen onStart={startGame} />;
  }

  return (
    <DraftDesk
      phase={state.phase}
      players={state.players}
      slotIndex={state.slotIndex}
      prompt={state.currentPrompt}
      turnOrder={state.turnOrder}
      currentTurnIndex={state.currentTurnIndex}
      timerSeconds={state.settings.timerSeconds}
      usedPlayerSeasons={state.usedPlayerSeasons}
      gmName={state.gmName}
      revealIndex={state.revealIndex}
      onLockValid={lockValidPick}
      onMarkBrick={markBrick}
      onTimeout={handleTimeout}
      onRevealNext={revealNext}
      onPlayAgain={playAgain}
      onNewGame={newGame}
    />
  );
}
