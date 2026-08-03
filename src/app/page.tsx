"use client";

import { useEffect, useState } from "react";
import type {
  GamePlayer,
  GameSettings,
  GameState,
  PromptDeck,
  RosterPick,
  RosterSlot,
} from "@/lib/types";
import { ROSTER_SLOTS } from "@/lib/roster";
import { promptForSlot } from "@/data/prompts";
import { RANDOM_DECK_ID } from "@/lib/decks";
import { BUILT_IN_DECKS } from "@/lib/builtInDecks";
import { lookupPick } from "@/lib/playerData";
import { pointsFor } from "@/lib/scoring";
import {
  clearGameState,
  loadDecks,
  loadGameState,
  saveDecks,
  saveGameState,
} from "@/lib/storage";
import SetupScreen from "@/components/SetupScreen";
import DraftDesk from "@/components/DraftDesk";

const DEFAULT_SETTINGS: GameSettings = {
  timerSeconds: 30,
  scoring: "ppr",
  deckId: RANDOM_DECK_ID,
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
  const [decks, setDecks] = useState<PromptDeck[] | null>(null);

  // Restore any in-progress game and saved prompt decks after mount (both
  // are localStorage-backed external stores, so hydrating them has to
  // happen client-side, one time, after the SSR-safe initial render).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadGameState();
    if (saved) setState(saved);
    setDecks(loadDecks());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the in-progress game persisted so an accidental refresh mid-round
  // doesn't lose it. The blank setup form is never persisted.
  useEffect(() => {
    if (state.phase === "setup") return;
    saveGameState(state);
  }, [state]);

  useEffect(() => {
    if (decks !== null) saveDecks(decks);
  }, [decks]);

  const customDecks = decks ?? [];
  const deckList = [...BUILT_IN_DECKS, ...customDecks];

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
    const { prompt, usedPromptIds } = promptForSlot(
      settings.deckId,
      deckList,
      0,
      [],
    );
    setState({
      phase: "draft",
      settings,
      gmName,
      players,
      usedPromptIds,
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
      const { prompt: nextPrompt, usedPromptIds } = promptForSlot(
        prev.settings.deckId,
        deckList,
        nextSlotIndex,
        prev.usedPromptIds,
      );

      return {
        ...prev,
        players,
        usedPlayerSeasons,
        slotIndex: nextSlotIndex,
        turnOrder: rotatedTurnOrder,
        currentTurnIndex: 0,
        currentPrompt: nextPrompt,
        usedPromptIds,
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

  /** Lets the GM fix a misclick on an already-entered pick, without
   * touching turn order or advancing the slot — only that one cell
   * changes. `pick` of null clears the slot back to empty. */
  const editPick = (playerId: string, slot: RosterSlot, pick: RosterPick | null) => {
    setState((prev) => {
      const oldPick = prev.players.find((p) => p.id === playerId)?.roster[
        slot
      ];
      const usedPlayerSeasons = new Set(prev.usedPlayerSeasons);
      if (oldPick?.status === "filled") {
        usedPlayerSeasons.delete(`${oldPick.playerName}|${oldPick.season}`);
      }
      if (pick?.status === "filled") {
        usedPlayerSeasons.add(`${pick.playerName}|${pick.season}`);
      }
      const players = prev.players.map((p) => {
        if (p.id !== playerId) return p;
        const roster = { ...p.roster };
        if (pick) {
          roster[slot] = pick;
        } else {
          delete roster[slot];
        }
        return { ...p, roster };
      });
      return { ...prev, players, usedPlayerSeasons };
    });
  };

  const editLockValid = (
    playerId: string,
    slot: RosterSlot,
    name: string,
    season: number,
  ) => {
    const found = lookupPick(name, season);
    if (!found) return;
    const points = pointsFor(
      state.settings.scoring,
      found.fantasyPoints,
      found.fantasyPointsPpr,
    );
    editPick(playerId, slot, {
      status: "filled",
      playerName: name,
      season,
      position: found.position,
      team: found.team,
      points,
    });
  };

  const revealNext = () => {
    setState((prev) => ({
      ...prev,
      revealIndex: Math.min(prev.revealIndex + 1, ROSTER_SLOTS.length),
    }));
  };

  const playAgain = () => {
    setState((prev) => {
      const players = prev.players.map((p) => ({ ...p, roster: {} }));
      const { prompt, usedPromptIds } = promptForSlot(
        prev.settings.deckId,
        deckList,
        0,
        [],
      );
      return {
        phase: "draft",
        settings: prev.settings,
        gmName: prev.gmName,
        players,
        usedPromptIds,
        usedPlayerSeasons: new Set(),
        slotIndex: 0,
        turnOrder: players.map((p) => p.id),
        currentTurnIndex: 0,
        currentPrompt: prompt,
        revealIndex: 0,
      };
    });
  };

  const newGame = () => {
    clearGameState();
    setState(initialState());
  };

  const createDeck = (deck: PromptDeck) =>
    setDecks((prev) => [...(prev ?? []), deck]);
  const updateDeck = (deck: PromptDeck) =>
    setDecks((prev) => (prev ?? []).map((d) => (d.id === deck.id ? deck : d)));
  const deleteDeck = (id: string) =>
    setDecks((prev) => (prev ?? []).filter((d) => d.id !== id));

  if (state.phase === "setup") {
    return (
      <SetupScreen
        onStart={startGame}
        builtInDecks={BUILT_IN_DECKS}
        customDecks={customDecks}
        onCreateDeck={createDeck}
        onUpdateDeck={updateDeck}
        onDeleteDeck={deleteDeck}
      />
    );
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
      onEditLockValid={editLockValid}
      onEditMarkBrick={(playerId, slot) =>
        editPick(playerId, slot, { status: "brick", points: 0 })
      }
      onClearPick={(playerId, slot) => editPick(playerId, slot, null)}
      onRevealNext={revealNext}
      onPlayAgain={playAgain}
      onNewGame={newGame}
    />
  );
}
